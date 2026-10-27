"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMenuItems } from "@/hooks/use-menu";
import { useIngredients } from "@/hooks/use-inventory";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface PriceRule {
  id: string;
  name: string;
  percent: string | number;
  stockBelow: string | number | null;
  demandQty: number | null;
  demandHours: number | null;
  ingredientId?: string | null;
}

export default function DynamicPricesPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const items = useMenuItems(branchId);
  const ingredients = useIngredients(branchId);
  const rules = useQuery({
    queryKey: ["menu-price-rules", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<PriceRule[]>(`/menu/price-rules?branchId=${branchId}`),
  });
  const [name, setName] = useState("");
  const [percent, setPercent] = useState("10");
  const [menuItemId, setMenuItemId] = useState("");
  const [ingredientId, setIngredientId] = useState("");
  const [stockBelow, setStockBelow] = useState("");
  const [demandQty, setDemandQty] = useState("");
  const [demandHours, setDemandHours] = useState("2");
  const dynamic = (rules.data ?? []).filter((rule) => rule.stockBelow != null || rule.demandQty != null);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/menu" className="text-sm text-muted-foreground">Back to the menu</Link>
      <div>
        <h1 className="text-2xl font-semibold">Stock and demand prices</h1>
        <p className="text-sm text-muted-foreground">
          Raise or lower a dish when an ingredient is below the level you set, or when paid sales of that dish pass a count in the last few hours. The price stays between 10% and 300% of the menu price.
        </p>
      </div>
      <Card className="grid gap-3 p-4 md:grid-cols-2">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input inputMode="decimal" aria-label="Percent" placeholder="Percent" value={percent} onChange={(e) => setPercent(e.target.value)} />
        <select aria-label="Dish" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={menuItemId} onChange={(e) => setMenuItemId(e.target.value)}>
          <option value="">Every dish</option>
          {(items.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select aria-label="Ingredient" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={ingredientId} onChange={(e) => setIngredientId(e.target.value)}>
          <option value="">No stock gate</option>
          {(ingredients.data ?? []).map((row) => <option key={row.id} value={row.id}>{row.name} · {row.currentStock} {row.unit}</option>)}
        </select>
        <Input inputMode="decimal" placeholder="Stock below" value={stockBelow} onChange={(e) => setStockBelow(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input inputMode="numeric" placeholder="Sales count" value={demandQty} onChange={(e) => setDemandQty(e.target.value)} />
          <Input inputMode="numeric" placeholder="Hours" value={demandHours} onChange={(e) => setDemandHours(e.target.value)} />
        </div>
        <Button
          type="button"
          disabled={!name.trim() || (!stockBelow && !demandQty)}
          onClick={() =>
            api.post(`/menu/price-rules?branchId=${branchId}`, {
              name: name.trim(),
              percent: Number(percent),
              daysOfWeek: [],
              menuItemId: menuItemId || null,
              ingredientId: ingredientId || null,
              stockBelow: stockBelow ? Number(stockBelow) : null,
              demandQty: demandQty ? Number(demandQty) : null,
              demandHours: demandQty ? Number(demandHours) || 2 : null,
            })
              .then(() => {
                toast.success("Price rule saved");
                setName("");
                void qc.invalidateQueries({ queryKey: ["menu-price-rules", branchId] });
              })
              .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"))
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
              <th className="px-3 py-2 font-medium">Percent</th>
              <th className="px-3 py-2 font-medium">Gate</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {dynamic.map((rule) => (
              <tr key={rule.id} className="border-t border-border">
                <td className="px-3 py-2">{rule.name}</td>
                <td className="px-3 py-2">{Number(rule.percent)}%</td>
                <td className="px-3 py-2">
                  {rule.stockBelow != null ? `stock below ${rule.stockBelow}` : ""}
                  {rule.demandQty != null ? ` ${rule.demandQty} sold in ${rule.demandHours ?? 1}h` : ""}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button type="button" size="sm" variant="outline" onClick={() => api.delete(`/menu/price-rules/${rule.id}?branchId=${branchId}`).then(() => qc.invalidateQueries({ queryKey: ["menu-price-rules", branchId] }))}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
