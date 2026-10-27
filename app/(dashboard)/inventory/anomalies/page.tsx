"use client";

import { useQuery } from "@tanstack/react-query";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";

interface Flag {
  metric: string;
  latest: number;
  mean: number;
  zScore: number | null;
}

export default function AnomaliesPage() {
  const { branchId } = useBranch();
  const flags = useQuery({
    queryKey: ["inventory-anomalies", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<Flag[]>(`/inventory/anomalies?branchId=${branchId}`),
  });

  return (
    <div className="flex flex-col gap-4">
      <InventoryTabs />
      <div>
        <h1 className="text-2xl font-semibold">Anomalies</h1>
        <p className="text-sm text-muted-foreground">
          Today is compared with the previous 13 days for sales, discounts, waste cost, refunds, and stock movement. A day is flagged when it sits at least two standard deviations from that baseline.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(flags.data ?? []).map((flag) => (
          <Card key={flag.metric} className="p-4">
            <p className="text-sm font-semibold">{flag.metric}</p>
            <p className="text-2xl font-semibold tabular-nums">{flag.latest.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">
              Baseline {flag.mean.toFixed(2)}
              {flag.zScore != null ? ` · z ${flag.zScore}` : ""}
            </p>
          </Card>
        ))}
      </div>
      {flags.data && flags.data.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing unusual against the last two weeks.</p>
      )}
    </div>
  );
}
