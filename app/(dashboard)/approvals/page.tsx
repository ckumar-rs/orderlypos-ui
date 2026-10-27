"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { useManagedOrders } from "@/hooks/use-orders";
import { ApiError, api } from "@/lib/api";

interface ApprovalRow {
  id: string;
  kind: string;
  status: string;
  note: string | null;
  orderId: string | null;
  createdAt: string;
  requestedBy: { name: string };
}

export default function ApprovalsPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const rows = useQuery({
    queryKey: ["approvals", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<ApprovalRow[]>(`/service/approvals?branchId=${branchId}`),
  });
  const orders = useManagedOrders(branchId, "active");
  const [kind, setKind] = useState("DISCOUNT");
  const [orderId, setOrderId] = useState("");
  const [note, setNote] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 text-sm">
        <Link href="/approvals/rules">Rules</Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold">Approvals</h1>
        <p className="text-sm text-muted-foreground">Ask before a discount, void, or refund. The cashier action uses an approved request for that bill. Rules stay off until you turn them on.</p>
      </div>
      <form className="grid gap-2 md:grid-cols-4" onSubmit={(event) => {
        event.preventDefault();
        api.post(`/service/approvals?branchId=${branchId}`, { kind, orderId: orderId || undefined, note })
          .then(() => { toast.success("Request sent"); setNote(""); qc.invalidateQueries({ queryKey: ["approvals", branchId] }); })
          .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not request"));
      }}>
        <select className="h-10 rounded-md border border-input bg-background px-2" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind">
          <option value="DISCOUNT">Discount</option>
          <option value="VOID">Void</option>
          <option value="REFUND">Refund</option>
        </select>
        <select className="h-10 rounded-md border border-input bg-background px-2" value={orderId} onChange={(e) => setOrderId(e.target.value)} aria-label="Order">
          <option value="">Bill</option>
          {(orders.data ?? []).map((order) => <option key={order.id} value={order.id}>#{order.orderNumber}</option>)}
        </select>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why" />
        <Button type="submit">Request</Button>
      </form>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>By</TableHead>
            <TableHead>Note</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(rows.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
              <TableCell>{row.kind}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.requestedBy.name}</TableCell>
              <TableCell>{row.note}</TableCell>
              <TableCell className="text-right">
                {row.status === "PENDING" ? (
                  <span className="flex justify-end gap-2">
                    <Button type="button" size="sm" onClick={() => decide(branchId, row.id, true, () => qc.invalidateQueries({ queryKey: ["approvals", branchId] }))}>Approve</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => decide(branchId, row.id, false, () => qc.invalidateQueries({ queryKey: ["approvals", branchId] }))}>Reject</Button>
                  </span>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function decide(branchId: string | null, id: string, approve: boolean, done: () => void) {
  api.post(`/service/approvals/${id}/decide?branchId=${branchId}`, { approve })
    .then(() => { toast.success(approve ? "Approved" : "Rejected"); done(); })
    .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not decide"));
}
