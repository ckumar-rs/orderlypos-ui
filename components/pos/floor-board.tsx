"use client";

import type { TableStatusDto } from "@nodedr-restaurant/types";
import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import { ElapsedTimer } from "@/components/tables/elapsed-timer";
import { TableShapeIcon } from "@/components/tables/table-shape-icon";
import { Button } from "@/components/ui/button";
import { ResponsiveTabs } from "@/components/ui/nav-picker";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import type { OpenOrder } from "@/hooks/use-orders";
import type { Floor, RestaurantTable } from "@/hooks/use-tables";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type FloorFilter = "ALL" | "FREE" | "SEATED" | "RESERVED";

const STATUS_STYLES: Record<TableStatusDto, string> = {
  AVAILABLE: "bg-success/10 border-success/30 text-success hover:bg-success/15",
  OCCUPIED: "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15",
  RESERVED: "bg-warning/10 border-warning/30 text-warning hover:bg-warning/15",
  CLEANING: "bg-muted border-border text-muted-foreground",
  OUT_OF_SERVICE: "bg-muted border-border text-muted-foreground opacity-50",
};

function matchesFilter(status: TableStatusDto, filter: FloorFilter) {
  if (filter === "ALL") return true;
  if (filter === "FREE") return status === "AVAILABLE";
  if (filter === "SEATED") return status === "OCCUPIED";
  return status === "RESERVED";
}

function tableHasLayout(tables: RestaurantTable[]) {
  return tables.some((t) => t.posX > 0 || t.posY > 0 || t.width > 80 || t.height > 80);
}

/** Mise-style floor: live bills, covers, elapsed — grid or spatial when laid out. */
export function FloorBoard({
  floors,
  openBills,
  selectedTableId,
  onSelect,
  isLoading = false,
  error = null,
  onRetry,
  retrying = false,
}: {
  floors: Floor[];
  openBills: OpenOrder[];
  selectedTableId?: string;
  onSelect: (table: RestaurantTable) => void;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const [activeFloorId, setActiveFloorId] = useState<string | undefined>();
  const [filter, setFilter] = useState<FloorFilter>("ALL");
  const activeFloor = floors.find((f) => f.id === (activeFloorId ?? floors[0]?.id));

  const billsByTable = useMemo(() => {
    const map = new Map<string, OpenOrder[]>();
    for (const bill of openBills) {
      if (!bill.tableId) continue;
      const list = map.get(bill.tableId) ?? [];
      list.push(bill);
      map.set(bill.tableId, list);
    }
    return map;
  }, [openBills]);

  const allTables = floors.flatMap((f) => f.tables);
  const counts = {
    ALL: allTables.length,
    FREE: allTables.filter((t) => t.status === "AVAILABLE").length,
    SEATED: allTables.filter((t) => t.status === "OCCUPIED").length,
    RESERVED: allTables.filter((t) => t.status === "RESERVED").length,
  };

  const visibleTables = useMemo(
    () => (activeFloor?.tables ?? []).filter((t) => matchesFilter(t.status, filter)),
    [activeFloor, filter],
  );

  const selected = allTables.find((t) => t.id === selectedTableId) ?? null;
  const selectedBills = selected ? billsByTable.get(selected.id) ?? [] : [];
  const seatedSpend = openBills
    .filter((b) => b.tableId && allTables.some((t) => t.id === b.tableId && t.status === "OCCUPIED"))
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  if (error && floors.length === 0) {
    return (
      <QueryError error={error} what="the floor" onRetry={() => onRetry?.()} retrying={retrying} />
    );
  }
  if (isLoading && floors.length === 0) {
    return (
      <div className="grid h-full grid-cols-3 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-5" aria-busy="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (floors.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No tables are set up for this branch yet. A manager can add them under Tables.
      </p>
    );
  }

  const useMap = Boolean(activeFloor && tableHasLayout(activeFloor.tables));
  const mapW = activeFloor
    ? Math.max(640, ...activeFloor.tables.map((t) => t.posX + Math.max(t.width, 96) + 48))
    : 640;
  const mapH = activeFloor
    ? Math.max(360, ...activeFloor.tables.map((t) => t.posY + Math.max(t.height, 96) + 48))
    : 360;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3 sm:p-4 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["ALL", "All"],
              ["FREE", "Free"],
              ["SEATED", "Seated"],
              ["RESERVED", "Reserved"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                filter === id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {label}{" "}
              <span className={cn("font-mono", filter === id ? "opacity-90" : "text-foreground")}>
                {counts[id]}
              </span>
            </button>
          ))}
        </div>

        {floors.length > 1 ? (
          <ResponsiveTabs
            label="Floor"
            value={activeFloor?.id ?? floors[0].id}
            onChange={setActiveFloorId}
            items={floors.map((f) => ({
              id: f.id,
              label: f.name,
              hint: `${f.tables.filter((t) => t.status === "AVAILABLE").length} free`,
            }))}
          />
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto">
          {useMap && activeFloor ? (
            <div
              className="relative rounded-xl border border-border bg-secondary/40"
              style={{
                width: mapW,
                height: mapH,
                backgroundImage: `radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)`,
                backgroundSize: `${activeFloor.gridSize ?? 20}px ${activeFloor.gridSize ?? 20}px`,
              }}
            >
              {visibleTables.map((table) => (
                <FloorTile
                  key={table.id}
                  table={table}
                  bills={billsByTable.get(table.id) ?? []}
                  selected={table.id === selectedTableId}
                  onSelect={onSelect}
                  style={{
                    position: "absolute",
                    left: table.posX,
                    top: table.posY,
                    width: Math.max(table.width, 104),
                    height: Math.max(table.height, 104),
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid auto-rows-min grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {visibleTables.map((table) => (
                <FloorTile
                  key={table.id}
                  table={table}
                  bills={billsByTable.get(table.id) ?? []}
                  selected={table.id === selectedTableId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
          {visibleTables.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No tables match this filter.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground lg:border-t lg:border-border lg:pt-3">
          <Legend color="bg-success" label="Available" />
          <Legend color="bg-primary" label="Occupied" />
          <Legend color="bg-warning" label="Reserved" />
          <Legend color="bg-muted-foreground" label="Cleaning / out of service" />
        </div>
      </div>

      <aside className="hidden w-72 shrink-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">Floor snapshot</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="font-mono text-2xl text-foreground">{counts.SEATED}</p>
            <p className="text-xs text-muted-foreground">In use</p>
          </div>
          <div>
            <p className="font-mono text-2xl text-foreground">{counts.FREE}</p>
            <p className="text-xs text-muted-foreground">Free</p>
          </div>
          <div className="col-span-2">
            <p className="font-mono text-2xl text-foreground">{formatCurrency(seatedSpend)}</p>
            <p className="text-xs text-muted-foreground">Open on floor</p>
          </div>
        </div>

        {selected ? (
          <div className="mt-auto space-y-3 rounded-xl border border-border bg-secondary p-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selected.name ?? `Table ${selected.number}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selected.status} · {selected.capacity} seats
                {selected.assignedWaiter ? ` · ${selected.assignedWaiter.name}` : ""}
              </p>
              {(selected.status === "OCCUPIED" || selected.status === "RESERVED") && (
                <ElapsedTimer
                  since={selected.statusSince}
                  className="mt-1 font-mono text-xs text-muted-foreground"
                />
              )}
            </div>
            {selectedBills.length > 0 ? (
              <ul className="space-y-1.5">
                {selectedBills.map((bill) => (
                  <li
                    key={bill.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-card px-2.5 py-1.5 text-xs"
                  >
                    <span>
                      #{bill.orderNumber.slice(-4)}
                      {bill.guestCount ? ` · ${bill.guestCount} covers` : ""}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatCurrency(Number(bill.totalAmount))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No open bill yet.</p>
            )}
            <Button className="w-full" size="sm" onClick={() => onSelect(selected)}>
              {selectedBills.length > 0 ? "Continue order" : "Open menu"}
            </Button>
          </div>
        ) : (
          <p className="mt-auto text-xs text-muted-foreground">
            Tap a table to start or continue an order. Occupied tiles show open bill totals.
          </p>
        )}
      </aside>
    </div>
  );
}

function FloorTile({
  table,
  bills,
  selected,
  onSelect,
  style,
}: {
  table: RestaurantTable;
  bills: OpenOrder[];
  selected: boolean;
  onSelect: (table: RestaurantTable) => void;
  style?: React.CSSProperties;
}) {
  const clickable = table.status !== "CLEANING" && table.status !== "OUT_OF_SERVICE";
  const billTotal = bills.reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const covers =
    bills.find((b) => b.guestCount && b.guestCount > 0)?.guestCount ?? table.capacity;
  const absolute = Boolean(style?.position === "absolute");

  return (
    <button
      type="button"
      disabled={!clickable}
      title={
        bills.length
          ? `${bills.length} open bill${bills.length === 1 ? "" : "s"} · ${formatCurrency(billTotal)}`
          : table.status
      }
      onClick={() => onSelect(table)}
      style={style}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 p-2 text-xs font-medium shadow-sm transition-transform",
        !absolute && "h-32 sm:h-36",
        clickable && "cursor-pointer hover:scale-[1.02] hover:shadow-md",
        !clickable && "cursor-not-allowed",
        STATUS_STYLES[table.status],
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <TableShapeIcon shape={table.shape} capacity={table.capacity} className="h-5 w-5 sm:h-6 sm:w-6" />
      <span className="text-sm font-semibold sm:text-base">
        {table.name ?? `T${table.number}`}
      </span>
      <span className="flex items-center gap-1 text-[11px] opacity-80">
        <Users className="h-3 w-3" />
        {covers}
        {bills.length > 1 ? ` · ${bills.length} bills` : ""}
      </span>
      {billTotal > 0 ? (
        <span className="font-mono text-[11px] font-semibold tabular-nums">
          {formatCurrency(billTotal)}
        </span>
      ) : null}
      {(table.status === "OCCUPIED" || table.status === "RESERVED") && (
        <ElapsedTimer since={table.statusSince} className="text-[10px] opacity-70" />
      )}
      {table.assignedWaiter ? (
        <span className="max-w-full truncate text-[10px] opacity-70">
          {table.assignedWaiter.name}
        </span>
      ) : null}
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
      {label}
    </div>
  );
}
