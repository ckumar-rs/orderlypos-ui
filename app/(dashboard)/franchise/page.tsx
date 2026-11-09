"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";
import { ReportSectionNav } from "@/components/reports/report-section-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Score {
  branchId: string;
  name: string;
  orders: number;
  sales: string;
  aov: string;
  covers: number;
  noShows: number;
}

interface FranchiseBoard {
  priceLock: boolean;
  branches: Score[];
}

export default function FranchisePage() {
  const { branchId } = useBranch();
  const { data: me } = useCurrentUser();
  const canLock = hasPermission(me?.user, "settings.manage");
  const queryClient = useQueryClient();

  const board = useQuery({
    queryKey: ["franchise"],
    queryFn: () => api.get<FranchiseBoard>("/platform/franchise"),
  });

  const toggleLock = useMutation({
    mutationFn: (priceLock: boolean) =>
      api.put<FranchiseBoard>("/platform/franchise", { priceLock }),
    onSuccess: (data) => {
      queryClient.setQueryData(["franchise"], data);
      toast.success(data.priceLock ? "Menu prices locked" : "Menu prices unlocked");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not update the lock"),
  });

  const rows = board.data?.branches ?? [];
  const totals = rows.reduce(
    (acc, row) => ({
      orders: acc.orders + row.orders,
      sales: acc.sales + Number(row.sales),
      covers: acc.covers + row.covers,
      noShows: acc.noShows + row.noShows,
    }),
    { orders: 0, sales: 0, covers: 0, noShows: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      <ReportSectionNav />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight">Franchise</h1>
          <p className="text-sm text-muted-foreground">
            This month across every active branch — paid orders, covers, and no-shows.
          </p>
        </div>
        <Card className="flex items-center gap-4 p-3 sm:px-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Price lock</p>
            <p className="text-xs text-muted-foreground">
              {board.data?.priceLock
                ? "On — only owner/admin can change menu prices"
                : "Off — branches can edit their own prices"}
            </p>
          </div>
          <Button
            type="button"
            variant={board.data?.priceLock ? "outline" : "default"}
            size="sm"
            className="gap-1.5 shrink-0"
            disabled={!branchId || !canLock || toggleLock.isPending || board.isLoading}
            onClick={() => toggleLock.mutate(!board.data?.priceLock)}
          >
            {board.data?.priceLock ? (
              <>
                <LockOpen className="h-3.5 w-3.5" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                Lock prices
              </>
            )}
          </Button>
        </Card>
      </div>

      {board.isError ? (
        <QueryError
          error={board.error}
          what="the franchise scoreboard"
          onRetry={() => void board.refetch()}
          retrying={board.isFetching}
        />
      ) : null}

      {board.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Branches" value={String(rows.length)} />
          <Stat label="Orders" value={String(totals.orders)} />
          <Stat label="Sales" value={formatCurrency(totals.sales)} />
          <Stat
            label="Covers"
            value={String(totals.covers)}
            hint={totals.noShows ? `${totals.noShows} no-shows` : undefined}
          />
        </div>
      )}

      {board.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No active branches yet. Add a branch under Settings to see franchise scores here.
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row, index) => {
            const active = row.branchId === branchId;
            return (
              <Card
                key={row.branchId}
                className={cn("flex flex-col gap-3 p-4", active && "ring-1 ring-primary/40")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      #{index + 1} this month
                      {active ? " · this register" : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(Number(row.sales))}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <Metric label="Orders" value={String(row.orders)} />
                  <Metric label="Avg ticket" value={formatCurrency(Number(row.aov))} />
                  <Metric label="Covers" value={String(row.covers)} />
                  <Metric label="No-shows" value={String(row.noShows)} />
                </dl>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 px-2.5 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
