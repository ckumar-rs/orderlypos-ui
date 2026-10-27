"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { flattenCategories, useCategories, useMenuItems } from "@/hooks/use-menu";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface PriceRule {
  id: string;
  name: string;
  percent: string | number;
  startTime: string | null;
  endTime: string | null;
  isActive: boolean;
  stockBelow: string | number | null;
  demandQty: number | null;
}

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function ScheduledPricesPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const categories = useCategories(branchId);
  const items = useMenuItems(branchId);
  const rules = useQuery({
    queryKey: ["menu-price-rules", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<PriceRule[]>(`/menu/price-rules?branchId=${branchId}`),
  });
  const [name, setName] = useState("");
  const [percent, setPercent] = useState("-10");
  const [start, setStart] = useState("16:00");
  const [end, setEnd] = useState("19:00");
  const [categoryId, setCategoryId] = useState("");
  const [menuItemId, setMenuItemId] = useState("");
  const timed = (rules.data ?? []).filter((rule) => rule.stockBelow == null && rule.demandQty == null);

  const save = () =>
    api.post(`/menu/price-rules?branchId=${branchId}`, {
      name: name.trim(),
      percent: Number(percent),
      startTime: start,
      endTime: end,
      daysOfWeek: DAYS,
      categoryId: categoryId || null,
      menuItemId: menuItemId || null,
    })
      .then(() => {
        toast.success("Scheduled price saved");
        setName("");
        void qc.invalidateQueries({ queryKey: ["menu-price-rules", branchId] });
      })
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"));

  return (
    <div className="flex flex-col gap-4">
      <Link href="/menu" className="text-sm text-muted-foreground">Back to the menu</Link>
      <div>
        <h1 className="text-2xl font-semibold">Scheduled menu prices</h1>
        <p className="text-sm text-muted-foreground">
          This changes the dish price on the menu during the window. A happy-hour promotion still discounts the bill separately. A negative percent lowers the price.
        </p>
      </div>
      <Card className="grid gap-3 p-4 md:grid-cols-3">
        <Input placeholder="Name, such as Happy hour mains" value={name} onChange={(e) => setName(e.target.value)} />
        <Input inputMode="decimal" aria-label="Percent" placeholder="Percent, such as -10" value={percent} onChange={(e) => setPercent(e.target.value)} />
        <Input type="time" aria-label="Starts" value={start} onChange={(e) => setStart(e.target.value)} />
        <Input type="time" aria-label="Ends" value={end} onChange={(e) => setEnd(e.target.value)} />
        <select aria-label="Category" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Any category</option>
          {flattenCategories(categories.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <select aria-label="Dish" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={menuItemId} onChange={(e) => setMenuItemId(e.target.value)}>
          <option value="">Any dish in that category</option>
          {(items.data ?? []).map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <Button type="button" disabled={!name.trim()} onClick={save}>Save schedule</Button>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {timed.map((rule) => (
          <Card key={rule.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{rule.name}</p>
              <p className="text-sm text-muted-foreground">{Number(rule.percent)}% · {rule.startTime}–{rule.endTime}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => api.delete(`/menu/price-rules/${rule.id}?branchId=${branchId}`).then(() => qc.invalidateQueries({ queryKey: ["menu-price-rules", branchId] }))}
            >
              Delete
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
