"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMenuItems, useMenuRuleActions, useMenuSets } from "@/hooks/use-menu";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MenuSetsCard({ branchId }: { branchId: string | null }) {
  const { data: sets } = useMenuSets(branchId);
  const { data: items } = useMenuItems(branchId);
  const actions = useMenuRuleActions(branchId);
  const [name, setName] = useState("");
  const [start, setStart] = useState("07:00");
  const [end, setEnd] = useState("11:00");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [picked, setPicked] = useState<string[]>([]);

  const toggleDay = (d: number) =>
    setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);
  const toggleItem = (id: string) =>
    setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

  const create = () =>
    actions.createSet.mutate(
      {
        name,
        daysOfWeek: days,
        startTime: start || undefined,
        endTime: end || undefined,
        menuItemIds: picked,
      },
      {
        onSuccess: () => {
          toast.success(`Menu set "${name}" added`);
          setName("");
          setPicked([]);
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not add menu set"),
      },
    );

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Menu sets</h2>
        <p className="text-xs text-muted-foreground">
          Breakfast, brunch, or late night. Dishes only in a set appear during that window. Dishes in no set stay listed.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input placeholder="Name (e.g. Breakfast)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        <Button disabled={!name.trim() || actions.createSet.isPending} onClick={create}>
          Add set
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {DAYS.map((label, day) => (
          <button
            key={label}
            type="button"
            onClick={() => toggleDay(day)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              days.includes(day)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto">
        {(items ?? []).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => toggleItem(item.id)}
            className={cn(
              "rounded-full border px-2 py-1 text-xs",
              picked.includes(item.id)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="flex flex-col divide-y divide-border">
        {(sets ?? []).map((set) => (
          <div key={set.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <p>
              <span className="font-medium">{set.name}</span>
              <span className="text-muted-foreground">
                {set.isForced ? " · pinned now" : ""}
                {set.startTime && set.endTime ? ` · ${set.startTime}–${set.endTime}` : " · all day"}
                {` · ${set.menuItemIds.length} dishes`}
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  actions.updateSet.mutate({ id: set.id, dto: { isForced: !set.isForced, isActive: true } })
                }
              >
                {set.isForced ? "Unpin" : "Use now"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => confirm(`Delete ${set.name}?`) && actions.deleteSet.mutate(set.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
