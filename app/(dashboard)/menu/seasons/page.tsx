"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { useMenuItems, useMenuRuleActions, useMenuSets } from "@/hooks/use-menu";
import { ApiError, api } from "@/lib/api";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function SeasonalMenusPage() {
  const { branchId } = useBranch();
  const sets = useMenuSets(branchId);
  const items = useMenuItems(branchId);
  const actions = useMenuRuleActions(branchId);
  const [name, setName] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [dishId, setDishId] = useState("");
  const [dishStart, setDishStart] = useState("");
  const [dishEnd, setDishEnd] = useState("");
  const dated = (sets.data ?? []).filter((set) => set.startsOn || set.endsOn);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/menu" className="text-sm text-muted-foreground">Back to the menu</Link>
      <div>
        <h1 className="text-2xl font-semibold">Seasonal and holiday menus</h1>
        <p className="text-sm text-muted-foreground">
          A dated menu set is published only between those dates. Breakfast, lunch, dinner, and late night stay on the menu page as named sets with a clock. A seasonal dish is hidden outside its own dates.
        </p>
      </div>
      <Card className="grid gap-3 p-4">
        <Input placeholder="Name, such as Christmas or monsoon" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input type="date" aria-label="Starts" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
          <Input type="date" aria-label="Ends" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
        </div>
        <div className="flex max-h-36 flex-wrap gap-1 overflow-y-auto">
          {(items.data ?? []).map((item) => (
            <button
              key={item.id}
              type="button"
              className={picked.includes(item.id) ? "rounded-full border border-primary bg-primary px-2 py-1 text-xs text-primary-foreground" : "rounded-full border border-border px-2 py-1 text-xs"}
              onClick={() => setPicked((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}
            >
              {item.name}
            </button>
          ))}
        </div>
        <Button
          type="button"
          className="justify-self-start"
          disabled={!name.trim() || !startsOn || !endsOn || actions.createSet.isPending}
          onClick={() =>
            actions.createSet.mutate(
              { name: name.trim(), startsOn, endsOn, daysOfWeek: DAYS, menuItemIds: picked },
              {
                onSuccess: () => {
                  toast.success("Dated menu saved");
                  setName("");
                  setPicked([]);
                },
                onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not save"),
              },
            )
          }
        >
          Publish menu
        </Button>
      </Card>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Menu</th>
              <th className="px-3 py-2 font-medium">From</th>
              <th className="px-3 py-2 font-medium">To</th>
              <th className="px-3 py-2 font-medium">Dishes</th>
            </tr>
          </thead>
          <tbody>
            {dated.map((set) => (
              <tr key={set.id} className="border-t border-border">
                <td className="px-3 py-2">{set.name}</td>
                <td className="px-3 py-2">{set.startsOn}</td>
                <td className="px-3 py-2">{set.endsOn}</td>
                <td className="px-3 py-2">{set.menuItemIds.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card className="grid gap-3 p-4 sm:grid-cols-4">
        <select aria-label="Dish" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={dishId} onChange={(e) => setDishId(e.target.value)}>
          <option value="">Seasonal dish</option>
          {(items.data ?? []).map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <Input type="date" aria-label="Season starts" value={dishStart} onChange={(e) => setDishStart(e.target.value)} />
        <Input type="date" aria-label="Season ends" value={dishEnd} onChange={(e) => setDishEnd(e.target.value)} />
        <Button
          type="button"
          disabled={!branchId || !dishId || !dishStart || !dishEnd}
          onClick={() =>
            api.patch(`/menu/items/${dishId}?branchId=${branchId}`, {
              isSeasonal: true,
              seasonStart: `${dishStart}T12:00:00.000Z`,
              seasonEnd: `${dishEnd}T12:00:00.000Z`,
            })
              .then(() => toast.success("Season saved on the dish"))
              .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save the season"))
          }
        >
          Save dish season
        </Button>
      </Card>
    </div>
  );
}
