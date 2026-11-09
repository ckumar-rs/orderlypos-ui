"use client";

import { Check, Flame, Hand, Layers, RotateCcw, Printer, Trash2, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAssembleExpo,
  useClearStalePass,
  useFireCourse,
  useKdsExpo,
  useKdsStations,
  useKdsTickets,
  useKitchenPerformance,
  usePassExpo,
  useReprintKot,
  useSetKotHeld,
  useUpdateKotStatus,
  type KotTicket,
} from "@/hooks/use-kds";
import { useKitchenCourses } from "@/hooks/use-menu";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const OPEN_STATUSES = new Set(["NEW", "ACCEPTED", "PREPARING", "READY"]);
/** Pass only shows this service window — stale KOTs from prior days stay off the rail. */
const SERVICE_WINDOW_MS = 12 * 60 * 60 * 1000;

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function inServiceWindow(createdAt: string, now: number) {
  return now - new Date(createdAt).getTime() <= SERVICE_WINDOW_MS;
}

function useNow(tickMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);
  return now;
}

function prepTargetMinutes(ticket: KotTicket) {
  const configured = ticket.items
    .map((item) => item.orderItem.menuItem?.prepTimeMinutes ?? 0)
    .filter((minutes) => minutes > 0);
  return configured.length > 0 ? Math.max(...configured) : 15;
}

function ticketLabel(ticket: KotTicket) {
  if (ticket.order.table) {
    const name = ticket.order.table.name?.trim();
    if (name) return name;
    return `T${ticket.order.table.number}`;
  }
  if (ticket.order.type === "TAKEAWAY") return "TW";
  if (ticket.order.type === "DELIVERY") return "DL";
  const num = ticket.order.orderNumber;
  return num.length > 6 ? `#${num.slice(-4)}` : `#${num}`;
}

function courseTitle(ticket: KotTicket) {
  return (ticket.course?.name ?? "Items").toUpperCase();
}

function fail(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

/** Mise-style expo pass: hanging tickets on a rail, control strip underneath. */
export function PassBoard({
  branchId,
  enabled = true,
  onLateCount,
}: {
  branchId: string | null;
  enabled?: boolean;
  onLateCount?: (count: number) => void;
}) {
  const now = useNow();
  const stations = useKdsStations(branchId);
  const ticketsQuery = useKdsTickets(branchId, "", enabled);
  const expo = useKdsExpo(branchId, enabled);
  const performance = useKitchenPerformance(branchId);
  const updateStatus = useUpdateKotStatus(branchId);
  const fire = useFireCourse(branchId);
  const setHeld = useSetKotHeld(branchId);
  const assemble = useAssembleExpo(branchId);
  const pass = usePassExpo(branchId);
  const reprint = useReprintKot(branchId);
  const clearStale = useClearStalePass(branchId);
  // Seeds Starters/Mains/Desserts on first visit so hold-by-default exists.
  useKitchenCourses(branchId, enabled);

  const openTickets = useMemo(
    () =>
      (ticketsQuery.data ?? []).filter(
        (t) =>
          OPEN_STATUSES.has(t.status) &&
          !t.held &&
          inServiceWindow(t.createdAt, now),
      ),
    [ticketsQuery.data, now],
  );
  const heldTickets = useMemo(
    () =>
      (ticketsQuery.data ?? []).filter(
        (t) =>
          t.held &&
          OPEN_STATUSES.has(t.status) &&
          inServiceWindow(t.createdAt, now),
      ),
    [ticketsQuery.data, now],
  );

  const fireHeld = (row: {
    key: string;
    course: string;
    courseId: string | null;
    orderId: string;
  }) => {
    if (row.courseId) {
      fire.mutate(
        { orderId: row.orderId, courseId: row.courseId },
        {
          onSuccess: () => toast.success(`${row.course} fired`),
          onError: (err) => fail(err, "Could not fire"),
        },
      );
      return;
    }
    setHeld.mutate(
      { id: row.key, held: false },
      {
        onSuccess: () => toast.success("Fired to the pass"),
        onError: (err) => fail(err, "Could not fire"),
      },
    );
  };

  const ticketMeta = useMemo(() => {
    return openTickets.map((ticket) => {
      const elapsedMs = now - new Date(ticket.createdAt).getTime();
      const targetMs = prepTargetMinutes(ticket) * 60_000;
      const late = elapsedMs >= targetMs;
      return { ticket, elapsedMs, late };
    });
  }, [openTickets, now]);

  const lateCount = ticketMeta.filter((t) => t.late).length;
  useEffect(() => {
    onLateCount?.(lateCount);
  }, [lateCount, onLateCount]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId && ticketMeta[0]) setSelectedId(ticketMeta[0].ticket.id);
    if (selectedId && !ticketMeta.some((t) => t.ticket.id === selectedId)) {
      setSelectedId(ticketMeta[0]?.ticket.id ?? null);
    }
  }, [ticketMeta, selectedId]);

  const selected = ticketMeta.find((t) => t.ticket.id === selectedId) ?? null;

  const byStation = useMemo(() => {
    const stationList =
      stations.data && stations.data.length > 0
        ? stations.data
        : [{ id: "__all", name: "Kitchen" }];
    return stationList.map((station) => {
      const rows =
        station.id === "__all"
          ? ticketMeta
          : ticketMeta.filter((row) => row.ticket.stationId === station.id);
      const avgMs =
        rows.length === 0
          ? 0
          : rows.reduce((sum, row) => sum + row.elapsedMs, 0) / rows.length;
      return { station, rows, avgMs };
    });
  }, [stations.data, ticketMeta]);

  const avgPassMs =
    ticketMeta.length === 0
      ? 0
      : ticketMeta.reduce((sum, row) => sum + row.elapsedMs, 0) / ticketMeta.length;

  const fireNext = useMemo(() => {
    const fromHeld = heldTickets.slice(0, 6).map((ticket) => ({
      key: ticket.id,
      label: ticketLabel(ticket),
      course: ticket.course?.name ?? "Course",
      note: ticket.order.notes,
      courseId: ticket.course?.id ?? null,
      orderId: ticket.orderId,
      elapsedMs: now - new Date(ticket.createdAt).getTime(),
      kind: "held" as const,
    }));
    if (fromHeld.length > 0) return fromHeld;
    return (expo.data ?? [])
      .flatMap((order) =>
        order.kots
          .filter((ticket) => ticket.held && ticket.course?.id)
          .map((ticket) => ({
            key: ticket.id,
            label: order.table
              ? order.table.name ?? `T${order.table.number}`
              : `#${order.orderNumber}`,
            course: ticket.course?.name ?? "Course",
            note: order.guestName,
            courseId: ticket.course?.id ?? null,
            orderId: order.orderId,
            elapsedMs: now - new Date(ticket.createdAt).getTime(),
            kind: "expo" as const,
          })),
      )
      .slice(0, 6);
  }, [heldTickets, expo.data, now]);

  const doneCount = (ticketsQuery.data ?? []).filter(
    (t) => t.status === "SERVED" && inServiceWindow(t.createdAt, now),
  ).length;

  const staleCount = useMemo(
    () =>
      (ticketsQuery.data ?? []).filter(
        (t) => OPEN_STATUSES.has(t.status) && !inServiceWindow(t.createdAt, now),
      ).length,
    [ticketsQuery.data, now],
  );

  const selectedExpo = useMemo(() => {
    if (!selected) return null;
    return (expo.data ?? []).find((o) => o.orderId === selected.ticket.orderId) ?? null;
  }, [expo.data, selected]);

  const canAssemble = Boolean(
    selectedExpo && selectedExpo.allReady && !selectedExpo.assembled,
  );
  const canPass = Boolean(selectedExpo?.assembled);

  if (ticketsQuery.isError) {
    return (
      <QueryError
        error={ticketsQuery.error}
        what="the pass"
        onRetry={() => void ticketsQuery.refetch()}
        retrying={ticketsQuery.isFetching}
      />
    );
  }

  const bumpSelected = () => {
    if (!selected) return;
    const ticket = selected.ticket;
    if (ticket.status === "READY") {
      if (canPass) {
        pass.mutate(ticket.orderId, {
          onSuccess: () => toast.success("Passed to the floor"),
          onError: (err) => fail(err, "Could not pass"),
        });
        return;
      }
      if (canAssemble) {
        toast.message("All courses ready — tap Assemble, then Pass");
        return;
      }
      toast.message("Mark every course ready, then Assemble");
      return;
    }
    const next =
      ticket.status === "NEW"
        ? "ACCEPTED"
        : ticket.status === "ACCEPTED"
          ? "PREPARING"
          : ticket.status === "PREPARING"
            ? "READY"
            : null;
    if (!next) return;
    updateStatus.mutate(
      { id: ticket.id, status: next },
      {
        onSuccess: () => toast.success(next === "READY" ? "Ready" : "Updated"),
        onError: (err) => fail(err, "Could not bump"),
      },
    );
  };

  const recallSelected = () => {
    if (!selected) return;
    const ticket = selected.ticket;
    if (ticket.status !== "READY" && ticket.status !== "SERVED") {
      toast.message("Only ready or served tickets can be recalled");
      return;
    }
    updateStatus.mutate(
      { id: ticket.id, status: "PREPARING" },
      {
        onSuccess: () => toast.success("Recalled to the pass"),
        onError: (err) => fail(err, "Could not recall"),
      },
    );
  };

  const refireSelected = () => {
    if (!selected) return;
    reprint.mutate(
      { id: selected.ticket.id, reprint: true },
      {
        onSuccess: () => toast.success("Reprint sent"),
        onError: (err) => fail(err, "Could not reprint"),
      },
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3 sm:p-4">
      {staleCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm">
          <p className="text-foreground">
            <span className="font-semibold">{staleCount}</span> kitchen ticket
            {staleCount === 1 ? "" : "s"} older than 12 hours — hidden from this rail, still open in Sales.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={clearStale.isPending}
            onClick={() =>
              clearStale.mutate(undefined, {
                onSuccess: (res) =>
                  toast.success(
                    res.cleared
                      ? `Cleared ${res.cleared} stale ticket${res.cleared === 1 ? "" : "s"} from the pass`
                      : "No stale tickets left",
                  ),
                onError: (err) => fail(err, "Could not clear stale tickets"),
              })
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
            {clearStale.isPending ? "Clearing…" : "Clear from pass"}
          </Button>
        </div>
      ) : null}

      <section className="relative shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary/70">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-11 z-10 h-1 rounded-full bg-border"
        />

        <div className="relative flex gap-5 overflow-x-auto px-4 pb-4 pt-3 sm:px-5">
          {ticketsQuery.isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="mt-10 h-48 w-36 shrink-0 rounded-lg" />
            ))}

          {!ticketsQuery.isLoading && byStation.every((s) => s.rows.length === 0) && (
            <div className="flex min-h-44 w-full items-center justify-center px-4">
              <p className="text-center text-sm text-muted-foreground">
                Nothing on the pass yet. Send from Menu and tickets appear here.
              </p>
            </div>
          )}

          {byStation.map(({ station, rows, avgMs }) => {
            if (rows.length === 0) return null;
            return (
              <div key={station.id} className="flex min-w-[9rem] shrink-0 flex-col gap-1.5">
                <div className="px-0.5">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    {station.name}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {rows.length} on · avg {formatElapsed(avgMs)}
                  </p>
                </div>
                <div className="flex items-start gap-2.5 pt-5">
                  {rows.map(({ ticket, elapsedMs, late }) => {
                    const active = ticket.id === selectedId;
                    const covers = ticket.items.reduce((n, i) => n + i.orderItem.quantity, 0);
                    const guest =
                      ticket.order.guestName ||
                      ticket.order.customer?.name ||
                      null;
                    return (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => setSelectedId(ticket.id)}
                        className={cn(
                          "relative w-36 shrink-0 rounded-lg border bg-card px-3 pb-3 pt-3 text-left shadow-sm transition-all",
                          "before:absolute before:left-1/2 before:top-[-9px] before:h-2.5 before:w-2.5 before:-translate-x-1/2 before:rounded-full before:border before:border-border before:bg-muted before:content-['']",
                          active
                            ? "border-primary ring-2 ring-primary/25"
                            : "border-border hover:-translate-y-0.5 hover:shadow-md",
                        )}
                      >
                        <p className="truncate text-xl font-bold leading-none tracking-tight text-foreground">
                          {ticketLabel(ticket)}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {guest ? `${guest} · ` : ""}
                          {covers} {covers === 1 ? "cover" : "covers"}
                        </p>
                        <p className="mt-2.5 text-[10px] font-bold tracking-wide text-destructive">
                          {courseTitle(ticket)}
                        </p>
                        <ul className="mt-1 max-h-28 space-y-0.5 overflow-hidden">
                          {ticket.items.slice(0, 5).map((item) => (
                            <li
                              key={item.id}
                              className="truncate text-[11px] leading-snug text-foreground"
                            >
                              {item.orderItem.quantity} {item.orderItem.nameSnapshot}
                            </li>
                          ))}
                          {ticket.items.length > 5 ? (
                            <li className="text-[10px] text-muted-foreground">
                              +{ticket.items.length - 5} more
                            </li>
                          ) : null}
                        </ul>
                        <div className="mt-3 flex items-end justify-between gap-1 border-t border-border/80 pt-2">
                          <span
                            className={cn(
                              "font-mono text-base font-semibold tabular-nums leading-none",
                              late ? "text-destructive" : "text-foreground",
                            )}
                          >
                            {formatElapsed(elapsedMs)}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {ticket.status === "READY"
                              ? "ready"
                              : ticket.status === "PREPARING"
                                ? "prep"
                                : ticket.status.toLowerCase()}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="ml-auto flex w-14 shrink-0 flex-col items-center justify-end gap-1.5 pb-1 pt-10">
            <div className="flex h-16 w-10 flex-col justify-end gap-0.5 overflow-hidden rounded-md border border-border bg-card p-1 shadow-sm">
              <div className="h-1.5 rounded-sm bg-secondary" />
              <div className="h-1.5 rounded-sm bg-secondary" />
              <div className="h-1.5 rounded-sm bg-secondary" />
            </div>
            <p className="text-center font-mono text-[10px] leading-tight text-muted-foreground">
              {doneCount}
              <br />
              done
            </p>
          </div>
        </div>
      </section>

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            On the pass
          </p>
          <div>
            <p className="font-mono text-4xl font-semibold tabular-nums text-foreground">
              {ticketMeta.length}
              <span className="ml-2 text-base font-medium text-muted-foreground">tickets</span>
            </p>
            {lateCount > 0 ? (
              <p className="mt-1 text-sm font-medium text-destructive">{lateCount} late</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">On time</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Average ticket time</p>
            <p className="font-mono text-3xl font-semibold tabular-nums text-foreground">
              {ticketMeta.length ? formatElapsed(avgPassMs) : "—"}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs tracking-wide text-muted-foreground uppercase">Fire next</p>
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {fireNext.length === 0 ? (
              <li className="text-sm text-muted-foreground">
                Nothing held. Tap Hold on a ticket, or mark a course hold-by-default under Menu → Kitchen.
              </li>
            ) : (
              fireNext.map((row) => (
                <li
                  key={row.key}
                  className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-2.5 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {row.label}{" "}
                      <span className="font-normal text-muted-foreground">{row.course}</span>
                    </p>
                    {row.note ? (
                      <p className="truncate text-[11px] text-destructive">{row.note}</p>
                    ) : null}
                  </div>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {formatElapsed(row.elapsedMs)}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1"
                    disabled={fire.isPending || setHeld.isPending}
                    onClick={() => fireHeld(row)}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    Fire
                  </Button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs tracking-wide text-muted-foreground uppercase">Stations</p>
          <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {(performance.data && performance.data.length > 0
              ? performance.data
              : byStation.map(({ station, rows, avgMs }) => ({
                  stationId: station.id,
                  stationName: station.name,
                  ticketsReady: rows.length,
                  avgMinutesToReady: rows.length ? avgMs / 60_000 : null,
                  delayRate: rows.length
                    ? rows.filter((r) => r.late).length / rows.length
                    : null,
                  throughputPerHour: 0,
                  slaCompliance: null,
                }))
            ).map((row) => {
              const lateShare = row.delayRate ?? 0;
              const onTimeShare = Math.max(0, 1 - lateShare);
              return (
                <li key={row.stationId} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">{row.stationName}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {row.avgMinutesToReady != null
                        ? `${Math.round(row.avgMinutesToReady)}m avg`
                        : "—"}
                      {row.ticketsReady ? ` · ${row.ticketsReady}` : ""}
                    </span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
                    <span
                      className="bg-foreground/70"
                      style={{ width: `${onTimeShare * 100}%` }}
                    />
                    <span
                      className="bg-destructive"
                      style={{ width: `${lateShare * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
          {selected ? (
            <>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {ticketLabel(selected.ticket)}{" "}
                    <span className="font-normal text-muted-foreground">
                      {selected.ticket.course?.name ?? "Ticket"} ·{" "}
                      {selected.ticket.items.reduce((n, i) => n + i.orderItem.quantity, 0)} covers
                    </span>
                  </p>
                  <p
                    className={cn(
                      "mt-1 font-mono text-2xl font-semibold tabular-nums",
                      selected.late ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {formatElapsed(selected.elapsedMs)}
                    {selected.late ? (
                      <span className="ml-2 text-sm font-medium">late</span>
                    ) : null}
                  </p>
                </div>
              </div>
              <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto text-sm">
                {selected.ticket.items.map((item) => (
                  <li key={item.id} className="leading-snug">
                    <span className="font-medium text-foreground">
                      {item.orderItem.quantity}× {item.orderItem.nameSnapshot}
                    </span>
                    {item.orderItem.modifiers.length > 0 ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {item.orderItem.modifiers.map((m) => m.nameSnapshot).join(", ")}
                      </span>
                    ) : null}
                    {item.orderItem.kitchenNote ? (
                      <span className="block text-xs text-destructive">
                        {item.orderItem.kitchenNote}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {selectedExpo ? (
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Order #{selectedExpo.orderNumber}
                  {selectedExpo.allReady ? " · all ready" : " · waiting on stations"}
                  {selectedExpo.assembled ? " · assembled" : ""}
                </p>
              ) : null}
              <div className="mt-1 grid grid-cols-2 gap-2">
                {canAssemble ? (
                  <Button
                    type="button"
                    className="gap-1"
                    disabled={assemble.isPending}
                    onClick={() =>
                      assemble.mutate(selected.ticket.orderId, {
                        onSuccess: () => toast.success("Assembled — ready to pass"),
                        onError: (err) => fail(err, "Could not assemble"),
                      })
                    }
                  >
                    <Layers className="h-4 w-4" />
                    Assemble
                  </Button>
                ) : canPass ? (
                  <Button
                    type="button"
                    className="gap-1"
                    disabled={pass.isPending}
                    onClick={() =>
                      pass.mutate(selected.ticket.orderId, {
                        onSuccess: () => toast.success("Passed to the floor"),
                        onError: (err) => fail(err, "Could not pass"),
                      })
                    }
                  >
                    <UtensilsCrossed className="h-4 w-4" />
                    Pass
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="gap-1"
                    disabled={updateStatus.isPending || pass.isPending}
                    onClick={bumpSelected}
                  >
                    <Check className="h-4 w-4" />
                    Bump
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1"
                  disabled={setHeld.isPending || selected.ticket.held}
                  onClick={() =>
                    setHeld.mutate(
                      { id: selected.ticket.id, held: true },
                      {
                        onSuccess: () => toast.success("Held — waiting in Fire next"),
                        onError: (err) => fail(err, "Could not hold"),
                      },
                    )
                  }
                >
                  <Hand className="h-4 w-4" />
                  Hold
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1"
                  disabled={updateStatus.isPending}
                  onClick={recallSelected}
                >
                  <RotateCcw className="h-4 w-4" />
                  Recall
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1"
                  disabled={reprint.isPending}
                  onClick={refireSelected}
                >
                  <Printer className="h-4 w-4" />
                  Refire
                </Button>
              </div>
            </>
          ) : (
            <p className="m-auto text-center text-sm text-muted-foreground">
              Select a ticket on the rail.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
