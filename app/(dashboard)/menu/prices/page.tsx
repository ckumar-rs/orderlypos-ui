"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MenuSubpageShell } from "@/components/menu/menu-subpage-shell";
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
  categoryId?: string | null;
  menuItemId?: string | null;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [percent, setPercent] = useState("-10");
  const [start, setStart] = useState("16:00");
  const [end, setEnd] = useState("19:00");
  const [categoryId, setCategoryId] = useState("");
  const [menuItemId, setMenuItemId] = useState("");
  const timed = (rules.data ?? []).filter((rule) => rule.stockBelow == null && rule.demandQty == null);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPercent("-10");
    setStart("16:00");
    setEnd("19:00");
    setCategoryId("");
    setMenuItemId("");
  };

  const loadRule = (rule: PriceRule) => {
    setEditingId(rule.id);
    setName(rule.name);
    setPercent(String(rule.percent));
    setStart(rule.startTime ?? "16:00");
    setEnd(rule.endTime ?? "19:00");
    setCategoryId(rule.categoryId ?? "");
    setMenuItemId(rule.menuItemId ?? "");
  };

  const save = () => {
    const body = {
      name: name.trim(),
      percent: Number(percent),
      startTime: start,
      endTime: end,
      daysOfWeek: DAYS,
      categoryId: categoryId || null,
      menuItemId: menuItemId || null,
    };
    const request = editingId
      ? api.put(`/menu/price-rules/${editingId}?branchId=${branchId}`, body)
      : api.post(`/menu/price-rules?branchId=${branchId}`, body);
    return request
      .then(() => {
        toast.success(editingId ? "Scheduled price updated" : "Scheduled price saved");
        resetForm();
        void qc.invalidateQueries({ queryKey: ["menu-price-rules", branchId] });
      })
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"));
  };

  return (
    <MenuSubpageShell
      title="Scheduled prices"
      description="Changes the dish price on the menu during the window. Happy-hour bill promos stay separate. A negative percent lowers the price."
    >
      <Card className="grid gap-3 p-4 sm:p-5 md:grid-cols-3">
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
        <div className="flex gap-2">
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
          <Button type="button" disabled={!name.trim()} onClick={save}>
            {editingId ? "Save" : "Create schedule"}
          </Button>
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {timed.map((rule) => (
          <Card key={rule.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{rule.name}</p>
              <p className="text-sm text-muted-foreground">{Number(rule.percent)}% · {rule.startTime}–{rule.endTime}</p>
            </div>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="outline" onClick={() => loadRule(rule)}>
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => api.delete(`/menu/price-rules/${rule.id}?branchId=${branchId}`).then(() => qc.invalidateQueries({ queryKey: ["menu-price-rules", branchId] }))}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </MenuSubpageShell>
  );
}
