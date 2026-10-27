"use client";

import { KdsNav } from "@/components/kds/kds-nav";
import { TicketCard } from "@/components/kds/ticket-card";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { useKdsStations, useKdsTickets, type KotTicket } from "@/hooks/use-kds";

function dueAt(ticket: KotTicket) {
  const minutes = ticket.items
    .map((item) => item.orderItem.menuItem?.prepTimeMinutes ?? 0)
    .filter((value) => value > 0);
  const target = minutes.length > 0 ? Math.max(...minutes) : 15;
  return new Date(ticket.createdAt).getTime() + target * 60_000;
}

export default function StationBoardPage() {
  const { branchId } = useBranch();
  const stations = useKdsStations(branchId);
  const tickets = useKdsTickets(branchId, "", Boolean(branchId));
  const live = (tickets.data ?? []).filter((ticket) => ticket.status !== "SERVED");
  const columns = [
    ...(stations.data ?? []).map((station) => ({
      id: station.id,
      name: station.role === "EXPO" ? `${station.name} (Expo)` : station.name,
    })),
    ...(live.some((ticket) => !ticket.stationId) ? [{ id: "", name: "Unassigned" }] : []),
  ];

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stations</h1>
        <p className="text-sm text-muted-foreground">One column for each kitchen station</p>
      </div>
      <KdsNav />
      {tickets.isError ? (
        <QueryError
          error={tickets.error}
          what="the station tickets"
          onRetry={() => void tickets.refetch()}
          retrying={tickets.isFetching}
        />
      ) : (
        <div className="flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnTickets = live
              .filter((ticket) => (ticket.stationId ?? "") === column.id)
              .sort((a, b) => Number(b.isPriority) - Number(a.isPriority) || dueAt(a) - dueAt(b));
            return (
              <section
                key={column.id || "unassigned"}
                aria-label={column.name}
                className="flex w-[85%] shrink-0 snap-center flex-col gap-3 rounded-2xl bg-secondary/40 p-3 sm:w-80"
              >
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-foreground">{column.name}</h2>
                  <span className="text-xs font-medium text-muted-foreground">{columnTickets.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {tickets.isLoading && <Skeleton className="h-32 rounded-2xl" />}
                  {columnTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} branchId={branchId} />
                  ))}
                  {!tickets.isLoading && columnTickets.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">No tickets</p>
                  )}
                </div>
              </section>
            );
          })}
          {!stations.isLoading && columns.length === 0 && (
            <p className="py-10 text-sm text-muted-foreground">No kitchen stations yet. Add them from the menu.</p>
          )}
        </div>
      )}
    </div>
  );
}
