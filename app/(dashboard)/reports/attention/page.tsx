"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";

interface Attention {
  oldOpenBills: Array<{ id: string; orderNumber: string; createdAt: string }>;
  delayedItems: Array<{ id: string; orderNumber: string; reason: string | null }>;
  lowStock: Array<{ id: string; name: string; currentStock: number }>;
  upcomingReservations: Array<{ id: string; customerName: string; reservedAt: string; guestCount: number }>;
}

export default function AttentionPage() {
  const { branchId } = useBranch();
  const feed = useQuery({
    queryKey: ["attention", branchId],
    enabled: Boolean(branchId),
    refetchInterval: 30_000,
    queryFn: () => api.get<Attention>(`/service/attention?branchId=${branchId}`),
  });
  const data = feed.data;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 text-sm">
        <Link href="/reports">Reports</Link>
        <Link href="/reports/floor">Floor</Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold">Needs attention</h1>
        <p className="text-sm text-muted-foreground">Open bills older than 45 minutes, delayed kitchen items, stock at the reorder level, and reservations in the next two hours.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Feed title="Open bills" empty="No old open bills" rows={(data?.oldOpenBills ?? []).map((row) => `#${row.orderNumber} since ${new Date(row.createdAt).toLocaleTimeString()}`)} />
        <Feed title="Kitchen delays" empty="Nothing delayed" rows={(data?.delayedItems ?? []).map((row) => `#${row.orderNumber}${row.reason ? ` · ${row.reason}` : ""}`)} />
        <Feed title="Low stock" empty="Stock is above reorder" rows={(data?.lowStock ?? []).map((row) => `${row.name} · ${row.currentStock}`)} />
        <Feed title="Arriving soon" empty="No reservations in the next two hours" rows={(data?.upcomingReservations ?? []).map((row) => `${row.customerName} · ${row.guestCount} · ${new Date(row.reservedAt).toLocaleTimeString()}`)} />
      </div>
    </div>
  );
}

function Feed({ title, empty, rows }: { title: string; empty: string; rows: string[] }) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <p className="font-medium">{title}</p>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : rows.map((row) => <p key={row} className="text-sm">{row}</p>)}
    </Card>
  );
}
