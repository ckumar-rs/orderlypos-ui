"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveTabs } from "@/components/ui/nav-picker";
import { flattenCategories, useCategories, useMenuItems, useUpdateMenuItem, type MenuItem } from "@/hooks/use-menu";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductGrid({
  branchId,
  onSelect,
}: {
  branchId: string | null;
  onSelect: (item: MenuItem) => void;
}) {
  const { data: categories } = useCategories(branchId);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [showEightySix, setShowEightySix] = useState(false);
  const { data: me } = useCurrentUser();
  const canManage = hasPermission(me?.user, "menu.manage");
  const updateItem = useUpdateMenuItem(branchId);
  const { data: items, isLoading, isError, error, refetch, isFetching } = useMenuItems(branchId, activeCategoryId);

  const filtered = items?.filter((i) => {
    if (!i.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (!showEightySix && i.isActive === false) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search menu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 flex-1"
        />
        {canManage ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showEightySix}
              onChange={(e) => setShowEightySix(e.target.checked)}
            />
            Show 86&apos;d
          </label>
        ) : null}
      </div>

      {categories && categories.length > 0 && (
        <ResponsiveTabs
          mobileOnly
          className="lg:hidden"
          label="Category"
          value={activeCategoryId ?? "all"}
          onChange={(id) => setActiveCategoryId(id === "all" ? undefined : id)}
          desktopListClassName="justify-start lg:h-auto lg:flex-wrap"
          items={[{ id: "all", label: "All" }, ...flattenCategories(categories).map((c) => ({ id: c.id, label: `${"— ".repeat(c.depth)}${c.name}`, hint: `${c._count.items} items` }))]}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-5">
      {categories && categories.length > 0 && (
        <nav
          aria-label="Category"
          className="hidden w-52 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border pr-3 lg:flex xl:w-60"
        >
          {[{ id: undefined as string | undefined, name: "All", count: undefined as number | undefined, depth: 0 }, ...flattenCategories(categories).map((c) => ({ id: c.id as string | undefined, name: c.name, count: c._count.items as number | undefined, depth: c.depth }))].map((c) => {
            const active = c.id === activeCategoryId;
            return (
              <button
                key={c.id ?? "all"}
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => setActiveCategoryId(c.id)}
                className={cn(
                  "flex min-h-10 items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                    : "font-medium text-foreground hover:bg-secondary",
                )}
              >
                <span className="min-w-0 break-words leading-tight" style={{ paddingLeft: c.depth ? c.depth * 10 : undefined }}>{c.name}</span>
                {c.count !== undefined && (
                  <span className={cn("shrink-0 text-xs tabular-nums", active ? "opacity-80" : "text-muted-foreground")}>
                    {c.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {isError && !items ? (
        <QueryError error={error} what="the menu" onRetry={() => void refetch()} retrying={isFetching} />
      ) : (
      <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto pb-4 sm:grid-cols-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        {filtered?.map((item) => (
          <div key={item.id} className="relative">
            <button
              type="button"
              onClick={() => {
                if (item.isActive === false) {
                  toast.error("This dish is 86'd");
                  return;
                }
                onSelect(item);
              }}
              className={cn(
                "flex min-h-24 w-full flex-col items-start gap-2 rounded-2xl border border-border bg-card p-3 text-left sm:p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] active:translate-y-0 lg:min-h-32 lg:justify-between lg:p-4 lg:hover:border-primary/50",
                item.isActive === false && "opacity-50",
              )}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${item.isVeg ? "bg-success" : "bg-destructive"}`}
              />
              <span className="text-sm font-medium leading-tight text-foreground lg:text-[15px]">{item.name}</span>
              {item.course?.name ? (
                <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {item.course.name}
                </span>
              ) : null}
              <span className="flex w-full items-baseline justify-between gap-2">
                <span className="text-sm font-semibold tabular-nums text-foreground lg:text-base">
                  {formatCurrency(item.price)}
                </span>
                {item.halfPrice != null && (
                  <span className="hidden text-[11px] tabular-nums text-muted-foreground lg:inline">
                    Half {formatCurrency(item.halfPrice)}
                  </span>
                )}
              </span>
            </button>
            {canManage ? (
              <button
                type="button"
                className="absolute right-2 top-2 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shadow-sm"
                onClick={(event) => {
                  event.stopPropagation();
                  const next = item.isActive === false;
                  updateItem.mutate(
                    { id: item.id, dto: { isActive: next } },
                    {
                      onSuccess: () => toast.success(next ? `"${item.name}" is back` : `"${item.name}" marked 86`),
                      onError: (err) =>
                        toast.error(err instanceof ApiError ? err.message : "Could not update"),
                    },
                  );
                }}
              >
                {item.isActive === false ? "Un-86" : "86"}
              </button>
            ) : null}
          </div>
        ))}
        {filtered?.length === 0 && !isLoading && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            {search ? <>No items match &quot;{search}&quot;</> : "No items in this category yet"}
          </p>
        )}
      </div>
      )}
      </div>
      </div>
    </div>
  );
}
