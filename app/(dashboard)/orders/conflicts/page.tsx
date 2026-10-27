"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OrderSectionNav } from "@/components/orders/order-section-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface Conflict {
  id: string;
  requestId: string;
  reason: string;
  createdAt: string;
}

export default function ConflictsPage() {
  const { branchId } = useBranch();
  const queryClient = useQueryClient();
  const rows = useQuery({
    queryKey: ["conflicts", branchId],
    queryFn: () => api.get<Conflict[]>(`/platform/conflicts?branchId=${branchId}`),
    enabled: !!branchId,
  });
  return (
    <div className="flex flex-col gap-4">
      <OrderSectionNav />
      <div>
        <h1 className="text-2xl font-semibold">Conflicts</h1>
        <p className="text-sm text-muted-foreground">
          A queued order or a head-office copy disagreed with what is already saved. The saved copy was kept.
        </p>
      </div>
      <div className="grid gap-3">
        {(rows.data ?? []).map((row) => (
          <Card key={row.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{row.reason}</p>
              <p className="text-sm text-muted-foreground">{row.requestId}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                api
                  .post(`/platform/conflicts/${row.id}/resolve?branchId=${branchId}`)
                  .then(() => queryClient.invalidateQueries({ queryKey: ["conflicts", branchId] }))
                  .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not resolve"))
              }
            >
              Mark resolved
            </Button>
          </Card>
        ))}
        {rows.data?.length === 0 ? <p className="text-sm text-muted-foreground">No open conflicts.</p> : null}
      </div>
    </div>
  );
}
