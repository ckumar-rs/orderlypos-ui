"use client";

import { CalendarClock, Check, Clock3, Pin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MenuSectionHeader } from "@/components/menu/menu-section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMenuItems, useMenuRuleActions, useMenuSets } from "@/hooks/use-menu";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MenuSetsCard({ branchId }: { branchId: string | null }) {
  const { data: sets } = useMenuSets(branchId);
  const { data: items } = useMenuItems(branchId);
  const actions = useMenuRuleActions(branchId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [start, setStart] = useState("07:00");
  const [end, setEnd] = useState("11:00");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [picked, setPicked] = useState<string[]>([]);

  const toggleDay = (d: number) =>
    setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);
  const toggleItem = (id: string) =>
    setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setStart("07:00");
    setEnd("11:00");
    setDays([0, 1, 2, 3, 4, 5, 6]);
    setPicked([]);
  };

  const save = () => {
    const dto = {
      name,
      daysOfWeek: days,
      startTime: start || null,
      endTime: end || null,
      menuItemIds: picked,
    };
    if (editingId) {
      actions.updateSet.mutate(
        { id: editingId, dto },
        {
          onSuccess: () => {
            toast.success(`Menu set "${name}" updated`);
            resetForm();
          },
          onError: (err) =>
            toast.error(err instanceof ApiError ? err.message : "Could not update menu set"),
        },
      );
      return;
    }
    actions.createSet.mutate(dto, {
      onSuccess: () => {
        toast.success(`Menu set "${name}" added`);
        resetForm();
      },
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not add menu set"),
    });
  };

  return (
    <Card className="flex flex-col gap-5 p-4 sm:p-6">
      <MenuSectionHeader
        title="Menu scheduling"
        description="Breakfast, brunch, or late night. Dishes only in a set appear during that window. Dishes in no set stay listed all day."
      />

      <div className="rounded-xl border border-border bg-secondary/20 p-4">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {editingId ? "Edit schedule" : "New schedule"}
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="set-name">Set name</Label>
            <Input
              id="set-name"
              placeholder="e.g. Breakfast"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="set-start">Start time</Label>
            <div className="relative">
              <Clock3 className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="set-start"
                className="pl-8"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="set-end">End time</Label>
            <div className="relative">
              <Clock3 className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="set-end"
                className="pl-8"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            {editingId && (
              <Button type="button" variant="outline" className="w-full" onClick={resetForm}>
                Cancel
              </Button>
            )}
            <Button
              className="w-full"
              disabled={
                !name.trim() || actions.createSet.isPending || actions.updateSet.isPending
              }
              onClick={save}
            >
              {actions.createSet.isPending || actions.updateSet.isPending
                ? "Saving…"
                : editingId
                  ? "Save schedule"
                  : "Add schedule"}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <Label className="mb-2 block">Days of week</Label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {DAYS.map((label, day) => {
              const on = days.includes(day);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(day)}
                  aria-pressed={on}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full",
                      on ? "bg-primary-foreground/20" : "bg-secondary",
                    )}
                  >
                    {on ? <Check className="h-3 w-3" /> : null}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Label>Assign dishes</Label>
            <span className="text-xs text-muted-foreground">
              {picked.length} selected
            </span>
          </div>
          {(items ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              Add menu items first, then assign them to this schedule.
            </p>
          ) : (
            <div className="grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl border border-border bg-card p-2 sm:grid-cols-2 lg:grid-cols-3">
              {(items ?? []).map((item) => {
                const on = picked.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-pressed={on}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors",
                      on
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background",
                      )}
                    >
                      {on ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {(sets ?? []).length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {(sets ?? []).map((set) => (
            <div
              key={set.id}
              className={cn(
                "flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
                set.isForced && "ring-1 ring-primary/25",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{set.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {set.startTime && set.endTime
                      ? `${set.startTime} – ${set.endTime}`
                      : "All day"}
                  </p>
                </div>
                {set.isForced ? (
                  <Badge className="gap-1 border-0 bg-primary/15 font-normal text-primary">
                    <Pin className="h-3 w-3" />
                    Pinned now
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((label, day) => (
                  <span
                    key={label}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-medium",
                      set.daysOfWeek.includes(day)
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground/50",
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                {set.menuItemIds.length} dish{set.menuItemIds.length === 1 ? "" : "es"} assigned
                {!set.isActive ? " · inactive" : ""}
              </p>

              <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(set.id);
                    setName(set.name);
                    setStart(set.startTime ?? "07:00");
                    setEnd(set.endTime ?? "11:00");
                    setDays(set.daysOfWeek.length ? set.daysOfWeek : [0, 1, 2, 3, 4, 5, 6]);
                    setPicked(set.menuItemIds ?? []);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    actions.updateSet.mutate({
                      id: set.id,
                      dto: { isForced: !set.isForced, isActive: true },
                    })
                  }
                >
                  {set.isForced ? "Unpin" : "Use now"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (!confirm(`Delete ${set.name}?`)) return;
                    actions.deleteSet.mutate(set.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No schedules yet. Create breakfast, lunch, or dinner windows above.
        </div>
      )}
    </Card>
  );
}
