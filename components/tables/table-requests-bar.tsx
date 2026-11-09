"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, BellRing, CheckCircle2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/use-realtime";
import { useSettings } from "@/hooks/use-settings";

interface TableRequestRow {
  id: string;
  type: "WAITER" | "BILL" | "PAID_CLAIM" | "COD";
  createdAt: string;
  table: { id: string; number: string; name: string | null };
}

/** Guest taps from the table QR page (waiter, bill, I paid, cash). */
export function TableRequestsBar({ branchId }: { branchId: string | null }) {
  const queryClient = useQueryClient();
  useRealtime(branchId);
  const { data: settings } = useSettings(branchId);
  const cashLabel = settings?.restaurant.cashLabel?.trim() || "Cash";
  const labelFor = (type: TableRequestRow["type"]) => {
    if (type === "WAITER") return "needs a waiter";
    if (type === "BILL") return "wants the bill";
    if (type === "PAID_CLAIM") return "says they paid — confirm on the till";
    return `wants ${cashLabel}`;
  };
  const { data } = useQuery({
    queryKey: ["table-requests", branchId],
    queryFn: () => api.get<TableRequestRow[]>(`/tables/requests?branchId=${branchId}`),
    enabled: !!branchId,
    refetchInterval: 10_000,
  });
  const resolve = useMutation({
    mutationFn: (id: string) => api.patch(`/tables/requests/${id}/resolve?branchId=${branchId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["table-requests"] }),
  });

  if (!data || data.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
      {data.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 text-foreground">
            {r.type === "BILL" ? (
              <Receipt className="h-4 w-4" />
            ) : r.type === "PAID_CLAIM" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : r.type === "COD" ? (
              <Banknote className="h-4 w-4" />
            ) : (
              <BellRing className="h-4 w-4" />
            )}
            {r.table.name ?? `Table ${r.table.number}`} — {labelFor(r.type)}
          </span>
          <Button size="sm" variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate(r.id)}>
            Done
          </Button>
        </div>
      ))}
    </div>
  );
}
