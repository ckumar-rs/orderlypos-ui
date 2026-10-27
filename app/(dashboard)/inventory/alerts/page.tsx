"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface AlertRow {
  id: string;
  kind: string;
  title: string;
  tier: string;
  openedAt: string;
  lastSentAt: string;
}

const TIER: Record<string, string> = {
  PUSH: "Pushed to inventory staff",
  EMAIL: "Emailed to inventory staff",
  ESCALATE: "Escalated to managers",
};

export default function AlertsPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const alerts = useQuery({
    queryKey: ["inventory-alerts", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<AlertRow[]>(`/inventory/alerts?branchId=${branchId}`),
  });

  return (
    <div className="flex flex-col gap-4">
      <InventoryTabs />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Low stock and batches expiring within seven days. The first notice is a push. If it is still open the next day, inventory staff are emailed when mail is configured. After two days it is escalated to managers. The 9:00 check does this on its own.
          </p>
        </div>
        <Button
          type="button"
          onClick={() =>
            api
              .post(`/inventory/alerts/run?branchId=${branchId}`)
              .then(() => {
                toast.success("Alerts checked");
                qc.invalidateQueries({ queryKey: ["inventory-alerts", branchId] });
              })
              .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not run alerts"))
          }
        >
          Check now
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(alerts.data ?? []).map((alert) => (
          <Card key={alert.id} className="p-4">
            <p className="text-xs text-muted-foreground">{alert.kind === "LOW_STOCK" ? "Low stock" : "Expiry"}</p>
            <p className="font-medium">{alert.title}</p>
            <p className="text-sm text-muted-foreground">{TIER[alert.tier] ?? alert.tier}</p>
          </Card>
        ))}
      </div>
      {alerts.data && alerts.data.length === 0 && (
        <p className="text-sm text-muted-foreground">No open inventory alerts.</p>
      )}
    </div>
  );
}
