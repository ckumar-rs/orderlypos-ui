"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface TableAnalytics {
  days: number;
  tables: {
    tableId: string;
    number: string;
    name: string | null;
    capacity: number;
    paidOrders: number;
    revenue: number;
    avgMinutes: number;
    turnover: number;
    revenuePerSeat: number;
  }[];
  totals: {
    paidOrders: number;
    revenue: number;
    avgMinutes: number;
    turnover: number;
    revenuePerSeat: number;
  };
}

export function TableAnalyticsCard({ branchId }: { branchId: string | null }) {
  const { data } = useQuery({
    queryKey: ["tables", "analytics", branchId],
    queryFn: () => api.get<TableAnalytics>(`/tables/analytics?branchId=${branchId}`),
    enabled: !!branchId,
  });
  if (!data) return null;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">Table analytics</p>
        <p className="text-xs text-muted-foreground">
          Last {data.days} days · paid dine-in bills with a table
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Turnover / day" value={String(data.totals.turnover)} />
        <Stat label="Avg dining minutes" value={String(Math.round(data.totals.avgMinutes))} />
        <Stat label="Revenue / seat" value={formatCurrency(data.totals.revenuePerSeat)} />
        <Stat label="Paid covers" value={String(data.totals.paidOrders)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">Table</th>
              <th className="py-1 font-medium">Bills</th>
              <th className="py-1 font-medium">Turnover</th>
              <th className="py-1 font-medium">Avg min</th>
              <th className="py-1 font-medium">Rev / seat</th>
            </tr>
          </thead>
          <tbody>
            {data.tables.map((row) => (
              <tr key={row.tableId} className="border-t border-border">
                <td className="py-1.5">{row.name ?? row.number}</td>
                <td className="py-1.5 tabular-nums">{row.paidOrders}</td>
                <td className="py-1.5 tabular-nums">{row.turnover}</td>
                <td className="py-1.5 tabular-nums">{row.avgMinutes}</td>
                <td className="py-1.5 tabular-nums">{formatCurrency(row.revenuePerSeat)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
