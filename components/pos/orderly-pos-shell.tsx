"use client";

import {
  Banknote,
  BookOpen,
  ChefHat,
  Grid2X2,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Pass/Floor/Menu/Sales labels — same four POS surfaces as before. */
export type OrderlyPosTab = "pass" | "floor" | "menu" | "sales";

const TABS: {
  id: OrderlyPosTab;
  label: string;
  icon: typeof ChefHat;
}[] = [
  { id: "pass", label: "Pass", icon: ChefHat },
  { id: "floor", label: "Floor", icon: Grid2X2 },
  { id: "menu", label: "Menu", icon: BookOpen },
  { id: "sales", label: "Sales", icon: Banknote },
];

export function OrderlyPosShell({
  restaurantName,
  dateLabel,
  shiftLabel,
  openTablesLabel,
  clock,
  tab,
  onTabChange,
  badges,
  children,
}: {
  restaurantName: string;
  dateLabel: string;
  shiftLabel: string;
  openTablesLabel: string;
  clock: string;
  tab: OrderlyPosTab;
  onTabChange: (tab: OrderlyPosTab) => void;
  badges?: Partial<Record<OrderlyPosTab, string>>;
  children: ReactNode;
}) {
  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col text-foreground lg:h-[calc(100dvh-6.5rem)]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {restaurantName}
              <span className="font-normal text-muted-foreground"> · {dateLabel}</span>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
            {shiftLabel}
          </div>
          <p className="text-xs text-muted-foreground">
            Open tables{" "}
            <span className="font-mono text-sm text-foreground">{openTablesLabel}</span>
          </p>
          <p className="font-mono text-lg font-semibold tabular-nums text-foreground sm:text-xl">
            {clock}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden bg-background">{children}</div>

        <nav
          aria-label="POS sections"
          className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-border bg-card px-3 py-3 sm:gap-2.5 sm:px-4"
        >
          {TABS.map((item) => {
            const active = tab === item.id;
            const Icon = item.icon;
            const badge = badges?.[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "inline-flex h-11 min-w-[5.75rem] items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors sm:min-w-[6.5rem] sm:px-5",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                <span>{item.label}</span>
                {badge ? (
                  <span className="rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
