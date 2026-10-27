"use client";

import type { KotStatusDto } from "@nodedr-restaurant/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BranchNotice } from "@/components/layout/branch-notice";
import { PerformanceWidget } from "@/components/kds/performance-widget";
import { IncomingOrderCard } from "@/components/kds/incoming-order-card";
import { LiveStatus } from "@/components/kds/live-status";
import { ExpoBoard } from "@/components/kds/expo-board";
import { KdsNav } from "@/components/kds/kds-nav";
import { TicketCard } from "@/components/kds/ticket-card";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { useBranch } from "@/hooks/use-branch";
import { useKdsSound } from "@/hooks/use-kds-sound";
import { useKdsIncoming, useKdsServingCopy, useKdsStations, useKdsTickets, type KotTicket } from "@/hooks/use-kds";
import { useKdsStationPreference } from "@/hooks/use-kds-station";
import { installAudioUnlock } from "@/lib/audio-unlock";
import { api, ApiError } from "@/lib/api";
import { flushQueue } from "@/lib/offline-queue";
import { resolveStation } from "@/lib/kds-station";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLUMNS: { status: KotStatusDto; label: string }[] = [
  { status: "NEW", label: "New" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY", label: "Ready" },
];

export default function KdsPage() {
  const { branchId } = useBranch();
  const { data: me } = useCurrentUser();
  const canAnswer = hasPermission(me?.user, "orders.accept");
  const { data: stations, isError: stationsFailed } = useKdsStations(branchId);
  // The station is a per-device choice (each kitchen screen shows its own), so
  // it is remembered in this browser per branch - see lib/kds-station.ts.
  const pref = useKdsStationPreference(branchId);
  const { active: activeStation, stale, ready } = resolveStation(pref.saved, stations, stationsFailed);
  const canFetch = pref.ready && ready;
  const tickets = useKdsTickets(branchId, activeStation, canFetch);
  const servingCopy = useKdsServingCopy(branchId, activeStation);
  useEffect(() => {
    if (!branchId) return;
    const flush = () => {
      void flushQueue(`kds-queue:${branchId}`, async (item) => {
        await api.patch(item.path, item.body);
      }).then((result) => {
        if (result.sent > 0) toast.success("Kitchen updates saved on this screen were sent.");
        if (result.conflicts.length) toast.error("A kitchen update conflicted with a ticket already moved.");
      });
    };
    window.addEventListener("online", flush);
    flush();
    return () => window.removeEventListener("online", flush);
  }, [branchId]);
  const incoming = useKdsIncoming(branchId, canAnswer);
  useKdsSound(branchId);
  useEffect(() => installAudioUnlock(), []);

  const expoStation = stations?.find((s) => s.id === activeStation && s.role === "EXPO");
  const liveTickets = (tickets.data ?? []).filter((t) => !t.held);
  const heldTickets = (tickets.data ?? []).filter((t) => t.held);
  const dueAt = (ticket: KotTicket) => {
    const minutes = ticket.items
      .map((item) => item.orderItem.menuItem?.prepTimeMinutes ?? 0)
      .filter((value) => value > 0);
    const target = minutes.length > 0 ? Math.max(...minutes) : 15;
    return new Date(ticket.createdAt).getTime() + target * 60_000;
  };
  const byStatus = (status: KotStatusDto): KotTicket[] =>
    liveTickets
      .filter((ticket) => ticket.status === status)
      .sort((a, b) => Number(b.isPriority) - Number(a.isPriority) || dueAt(a) - dueAt(b));
  const pendingOrders = incoming.data ?? [];

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col gap-4 lg:h-[calc(100dvh-8rem)]">
      <div>
        <h1 className="text-2xl font-semibold sm:text-[32px] tracking-tight text-foreground">
          Kitchen Display
        </h1>
        <p className="text-sm text-muted-foreground">Live order tickets by status</p>
        {servingCopy.data && (
          <p className="mt-2 text-sm text-warning">
            Showing the copy saved on this screen. Status changes stay here and send when the server is back.
          </p>
        )}
      </div>
      <KdsNav />

      <LiveStatus />
      <KitchenRush branchId={branchId} />

      {stations && stations.length > 0 && (
        <div role="group" aria-label="Station" className="flex flex-wrap gap-2">
          {[{ id: "", name: "All stations", role: "COOK" }, ...stations].map((s) => (
            <button
              key={s.id || "all"}
              type="button"
              aria-pressed={s.id === activeStation}
              onClick={() => pref.choose(s.id)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors",
                s.id === activeStation
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {s.role === "EXPO" ? `${s.name} (Expo)` : s.name}
            </button>
          ))}
        </div>
      )}

      {stale && (
        <p role="status" className="text-xs text-warning">
          The station saved on this screen no longer exists, so all stations are shown. Pick a station to pin it.
        </p>
      )}
      {pref.saveFailed && (
        <p role="alert" className="text-xs text-destructive">
          This browser blocked saving the choice, so it will reset when the page reloads.
        </p>
      )}

      <BranchNotice />

      {pendingOrders.length > 0 && (
        <section aria-label="Incoming orders" className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Incoming - needs a decision{" "}
            <span className="ml-1 rounded-full bg-destructive px-2 py-0.5 text-xs text-white">{pendingOrders.length}</span>
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pendingOrders.map((order) => (
              <IncomingOrderCard key={order.id} order={order} branchId={branchId} />
            ))}
          </div>
        </section>
      )}
      {canAnswer && incoming.isError && (
        <p role="alert" className="text-xs text-destructive">
          Could not check for incoming orders. They will show here once the connection is back.
        </p>
      )}

      <PerformanceWidget branchId={branchId} />

      {expoStation ? (
        <ExpoBoard branchId={branchId} />
      ) : tickets.isError ? (
        <QueryError
          error={tickets.error}
          what="the kitchen tickets"
          onRetry={() => void tickets.refetch()}
          retrying={tickets.isFetching}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          {heldTickets.length > 0 && (
            <section aria-label="Held courses" className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-foreground">Held — fire when the table is ready</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {heldTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} branchId={branchId} />
                ))}
              </div>
            </section>
          )}
        <div className="flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto sm:grid sm:snap-none sm:grid-cols-2 sm:gap-4 sm:overflow-hidden xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.status} className="flex w-[85%] shrink-0 snap-center flex-col gap-3 overflow-hidden rounded-2xl bg-secondary/40 p-3 sm:w-auto sm:shrink">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-foreground">{col.label}</h2>
                <span className="text-xs font-medium text-muted-foreground">
                  {byStatus(col.status).length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-2">
                {(tickets.isLoading || !canFetch) &&
                  Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl" />
                  ))}
                {byStatus(col.status).map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} branchId={branchId} />
                ))}
                {canFetch && !tickets.isLoading && byStatus(col.status).length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">No tickets</p>
                )}
              </div>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}

function KitchenRush({ branchId }: { branchId: string | null }) {
  const qc = useQueryClient();
  const load = useQuery({
    queryKey: ["kds-workload", branchId],
    enabled: Boolean(branchId),
    refetchInterval: 15_000,
    queryFn: () => api.get<{ openTickets: number; stations: Array<{ id: string | null; name: string; openTickets: number }> }>(`/kds/workload?branchId=${branchId}`),
  });
  const pause = useQuery({
    queryKey: ["online-orders", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<{ paused: boolean }>(`/kds/online-orders?branchId=${branchId}`),
  });
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{load.data?.openTickets ?? 0} open tickets</p>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1 text-sm"
          onClick={() =>
            api.post(`/kds/online-orders?branchId=${branchId}`, { paused: !pause.data?.paused })
              .then(() => qc.invalidateQueries({ queryKey: ["online-orders", branchId] }))
              .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not update online orders"))
          }
        >
          {pause.data?.paused ? "Resume online orders" : "Pause online orders"}
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {(load.data?.stations ?? []).map((station) => (
          <p key={station.id ?? "none"} className="text-sm">{station.name}: {station.openTickets}</p>
        ))}
      </div>
    </div>
  );
}
