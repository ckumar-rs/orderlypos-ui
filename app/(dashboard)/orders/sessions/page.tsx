"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OrderSectionNav } from "@/components/orders/order-section-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface SessionRow {
  id: string;
  orderNumber: string;
  partyName: string | null;
  guestCount: number | null;
  totalAmount: number;
  tableLabel: string | null;
}

export default function SessionsPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const sessions = useQuery({
    queryKey: ["table-sessions", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<SessionRow[]>(`/service/sessions?branchId=${branchId}`),
  });
  const grouped = new Map<string, SessionRow[]>();
  for (const row of sessions.data ?? []) {
    const key = row.tableLabel ?? "No table";
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  return (
    <div className="flex flex-col gap-4">
      <OrderSectionNav />
      <div>
        <h1 className="text-2xl font-semibold">Table sessions</h1>
        <p className="text-sm text-muted-foreground">Two open bills can share one table. Name each party so the floor can tell them apart.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...grouped.entries()].map(([table, rows]) => (
          <Card key={table} className="flex flex-col gap-3 p-4">
            <p className="font-semibold">{table}</p>
            {rows.map((row) => (
              <PartyRow key={row.id} branchId={branchId} row={row} onSaved={() => qc.invalidateQueries({ queryKey: ["table-sessions", branchId] })} />
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

function PartyRow({ branchId, row, onSaved }: { branchId: string | null; row: SessionRow; onSaved: () => void }) {
  const [name, setName] = useState(row.partyName ?? "");
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
      <p className="text-sm">#{row.orderNumber} · {formatCurrency(row.totalAmount)}{row.guestCount ? ` · ${row.guestCount} guests` : ""}</p>
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Party name" />
        <Button type="button" variant="outline" onClick={() => api.patch(`/service/sessions/${row.id}?branchId=${branchId}`, { partyName: name }).then(() => { toast.success("Party named"); onSaved(); }).catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"))}>Save</Button>
      </div>
    </div>
  );
}
