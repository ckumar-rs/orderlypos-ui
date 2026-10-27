"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PromoNav } from "@/components/marketing/promo-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { flattenCategories, useCategories } from "@/hooks/use-menu";
import { useBranch } from "@/hooks/use-branch";
import { useMarketingActions, usePromotions } from "@/hooks/use-marketing";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function CategoryDiscountsPage() {
  const { branchId } = useBranch();
  const categories = useCategories(branchId);
  const promotions = usePromotions(branchId);
  const { createPromotion, promotionActive, deletePromotion } = useMarketingActions(branchId);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [value, setValue] = useState("10");
  const rules = (promotions.data ?? []).filter(
    (row) =>
      row.allDay &&
      row.categoryId &&
      row.kind === "PERCENT" &&
      !row.customerId &&
      !row.weatherCode &&
      !row.bundleMenuItemId &&
      Number(row.minOrderAmount ?? 0) === 0,
  );
  const flat = flattenCategories(categories.data ?? []);

  return (
    <div className="flex flex-col gap-4">
      <PromoNav />
      <div>
        <h1 className="text-2xl font-semibold">Category discounts</h1>
        <p className="text-sm text-muted-foreground">
          A percent off every dish in one category, including its subcategories, on every open bill.
        </p>
      </div>
      <Card className="grid gap-3 p-4 sm:grid-cols-4">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <select
          aria-label="Category"
          className="h-10 rounded-md border border-input bg-background px-2 text-sm"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Category</option>
          {flat.map((category) => (
            <option key={category.id} value={category.id}>
              {`${"— ".repeat(category.depth)}${category.name}`}
            </option>
          ))}
        </select>
        <Input inputMode="decimal" placeholder="Percent" value={value} onChange={(e) => setValue(e.target.value)} />
        <Button
          type="button"
          disabled={createPromotion.isPending || !name.trim() || !categoryId}
          onClick={() =>
            createPromotion.mutate(
              {
                name: name.trim(),
                kind: "PERCENT",
                value: Number(value),
                categoryId,
                allDay: true,
                daysOfWeek: DAYS,
                startTime: "00:00",
                endTime: "23:59",
              },
              {
                onSuccess: () => {
                  toast.success("Category discount saved");
                  setName("");
                },
                onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not save"),
              },
            )
          }
        >
          Save rule
        </Button>
      </Card>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Rule</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Off</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rules.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className={cn("px-3 py-2", !row.isActive && "text-muted-foreground line-through")}>{row.name}</td>
                <td className="px-3 py-2">{flat.find((category) => category.id === row.categoryId)?.name ?? "Category"}</td>
                <td className="px-3 py-2">{Number(row.value)}%</td>
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="outline" type="button" onClick={() => promotionActive.mutate({ id: row.id, isActive: !row.isActive })}>
                    {row.isActive ? "Pause" : "Resume"}
                  </Button>
                  <Button size="sm" variant="outline" type="button" className="ml-2" onClick={() => confirm(`Delete ${row.name}?`) && deletePromotion.mutate(row.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {rules.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={4}>No category discounts yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
