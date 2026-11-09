"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { flattenCategories, useCategories } from "@/hooks/use-menu";
import { useBranch } from "@/hooks/use-branch";
import { useMarketingActions, usePromotions, type PromotionRow } from "@/hooks/use-marketing";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function QuantityPromotionsPage() {
  const { branchId } = useBranch();
  const categories = useCategories(branchId);
  const promotions = usePromotions(branchId);
  const { createPromotion, updatePromotion, promotionActive, deletePromotion } = useMarketingActions(branchId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [buy, setBuy] = useState("1");
  const [get, setGet] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const flat = flattenCategories(categories.data ?? []);
  const rules = (promotions.data ?? []).filter((row) => row.kind === "BOGO" && row.allDay);
  const pending = createPromotion.isPending || updatePromotion.isPending;

  const reset = () => {
    setEditingId(null);
    setName("");
    setBuy("1");
    setGet("1");
    setCategoryId("");
  };

  const loadEdit = (row: PromotionRow) => {
    setEditingId(row.id);
    setName(row.name);
    setBuy(String(row.buyQuantity ?? 1));
    setGet(String(row.getQuantity ?? 1));
    setCategoryId(row.categoryId ?? "");
  };

  const submit = () => {
    const dto = {
      name: name.trim(),
      kind: "BOGO",
      value: 0,
      buyQuantity: Number(buy) || 1,
      getQuantity: Number(get) || 1,
      categoryId: categoryId || null,
      allDay: true,
      daysOfWeek: DAYS,
      startTime: "00:00",
      endTime: "23:59",
    };
    if (editingId) {
      updatePromotion.mutate(
        { id: editingId, dto },
        {
          onSuccess: () => {
            toast.success("Quantity promotion updated");
            reset();
          },
          onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update"),
        },
      );
      return;
    }
    createPromotion.mutate(dto, {
      onSuccess: () => {
        toast.success("Quantity promotion created");
        reset();
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not save"),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Buy and get</h1>
        <p className="text-sm text-muted-foreground">
          Buy 1 get 1, or buy 2 get 1. The free units are the cheapest in each group. A category limits which dishes count.
        </p>
      </div>
      <Card className="grid gap-3 p-4 md:grid-cols-5">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input inputMode="numeric" aria-label="Buy" placeholder="Buy" value={buy} onChange={(e) => setBuy(e.target.value)} />
        <Input inputMode="numeric" aria-label="Get" placeholder="Get" value={get} onChange={(e) => setGet(e.target.value)} />
        <select
          aria-label="Category"
          className="h-10 rounded-md border border-input bg-background px-2 text-sm"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Any dish</option>
          {flat.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button type="button" disabled={pending || !name.trim()} onClick={submit}>
            {editingId ? "Save" : "Create"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {rules.map((row) => (
          <Card key={row.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className={cn("font-medium", !row.isActive && "text-muted-foreground line-through")}>{row.name}</p>
              <p className="text-sm text-muted-foreground">
                Buy {row.buyQuantity ?? 1} get {row.getQuantity ?? 1}
                {row.categoryId ? ` · ${flat.find((category) => category.id === row.categoryId)?.name ?? "category"}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" type="button" onClick={() => loadEdit(row)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" type="button" onClick={() => promotionActive.mutate({ id: row.id, isActive: !row.isActive })}>
                {row.isActive ? "Pause" : "Resume"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => {
                  if (!confirm(`Delete ${row.name}?`)) return;
                  deletePromotion.mutate(row.id, {
                    onSuccess: () => {
                      if (editingId === row.id) reset();
                    },
                  });
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
        {rules.length === 0 ? <p className="text-sm text-muted-foreground">No always-on quantity promotions yet.</p> : null}
      </div>
    </div>
  );
}
