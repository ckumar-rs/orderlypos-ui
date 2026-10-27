"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TableSectionNav } from "@/components/tables/table-section-nav";
import { useBranch } from "@/hooks/use-branch";
import { useFloors } from "@/hooks/use-tables";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface HistoryBill {
  id: string;
  orderNumber: string;
  status: string;
  guests: number | null;
  guestName: string | null;
  partyName: string | null;
  customerName: string | null;
  revenue: number;
  durationMinutes: number | null;
}

export default function TableHistoryPage() {
  const { branchId } = useBranch();
  const floors = useFloors(branchId);
  const [tableId, setTableId] = useState("");
  const history = useQuery({
    queryKey: ["table-history", branchId, tableId],
    enabled: Boolean(branchId && tableId),
    queryFn: () => api.get<{ bills: HistoryBill[] }>(`/tables/${tableId}/history?branchId=${branchId}`),
  });
  const bills = history.data?.bills ?? [];
  const revenue = bills.reduce((sum, bill) => sum + (bill.status === "PAID" ? bill.revenue : 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <TableSectionNav />
      <div>
        <h1 className="text-2xl font-semibold">Table history</h1>
        <p className="text-sm text-muted-foreground">Every bill on the selected table, with guests, how long it ran, and what it took.</p>
      </div>
      <select
        aria-label="Table"
        className="h-10 max-w-sm rounded-md border border-input bg-background px-2"
        value={tableId}
        onChange={(e) => setTableId(e.target.value)}
      >
        <option value="">Choose a table</option>
        {(floors.data ?? []).flatMap((floor) =>
          floor.tables.map((table) => (
            <option key={table.id} value={table.id}>{floor.name} · {table.number}</option>
          )),
        )}
      </select>
      {tableId ? <p className="text-sm">Paid revenue on this list: {formatCurrency(revenue)}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Bill</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Guests</th>
              <th className="px-3 py-2 font-medium">Party</th>
              <th className="px-3 py-2 font-medium">Minutes</th>
              <th className="px-3 py-2 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id} className="border-t border-border">
                <td className="px-3 py-2">#{bill.orderNumber}</td>
                <td className="px-3 py-2">{bill.status}</td>
                <td className="px-3 py-2">{bill.guests ?? "—"}</td>
                <td className="px-3 py-2">{bill.partyName || bill.guestName || bill.customerName || "—"}</td>
                <td className="px-3 py-2">{bill.durationMinutes ?? "—"}</td>
                <td className="px-3 py-2">{formatCurrency(bill.revenue)}</td>
              </tr>
            ))}
            {tableId && bills.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={6}>No bills on this table yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
