"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface DepositRow {
  id: string;
  customerName: string;
  reservedAt: string;
  status: string;
  deposit: number;
  depositStatus: string;
  depositMethod: string | null;
  feeCharged: number;
  ledger: { kind: string; amount: number; reference: string | null }[];
}

export default function ReservationDepositsPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const rows = useQuery({
    queryKey: ["reservations", "deposits", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<DepositRow[]>(`/reservations/deposits?branchId=${branchId}`),
  });

  const act = (id: string, kind: "refund" | "forfeit") => {
    api
      .post(`/reservations/${id}/deposit/${kind}?branchId=${branchId}`, {})
      .then(() => {
        toast.success(kind === "refund" ? "Deposit refunded" : "Deposit forfeited");
        qc.invalidateQueries({ queryKey: ["reservations", "deposits", branchId] });
      })
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not update the deposit"));
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href="/reservations" className="text-sm text-muted-foreground">Reservations</Link>
      <div>
        <h1 className="text-2xl font-semibold">Reservation deposits</h1>
        <p className="text-sm text-muted-foreground">
          Cash, card, and UPI are recorded as a house-account advance when the money is received. Wallet takes store credit. Refund gives it back. Forfeit keeps it. A no-show forfeits a held deposit, then uses the wallet, then the house account for the rest of the fee.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guest</TableHead>
            <TableHead>When</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Ledger</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(rows.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.customerName}</TableCell>
              <TableCell>{new Date(row.reservedAt).toLocaleString()}</TableCell>
              <TableCell>{formatCurrency(row.deposit)}</TableCell>
              <TableCell>{row.depositStatus}</TableCell>
              <TableCell>{row.depositMethod ?? "—"}</TableCell>
              <TableCell>{formatCurrency(row.feeCharged)}</TableCell>
              <TableCell>
                {row.ledger.map((entry, index) => (
                  <div key={`${row.id}-${index}`} className="text-xs text-muted-foreground">
                    {entry.kind} {formatCurrency(entry.amount)} {entry.reference ?? ""}
                  </div>
                ))}
              </TableCell>
              <TableCell>
                {row.depositStatus === "HELD" && (
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => act(row.id, "refund")}>Refund</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => act(row.id, "forfeit")}>Forfeit</Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
