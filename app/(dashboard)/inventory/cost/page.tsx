"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface CostReport {
  targetPercent: number;
  items: Array<{ id: string; name: string; price: number; foodCost: number; foodCostPercent: number; suggestedPrice: number; hasRecipe: boolean }>;
}

export default function FoodCostPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const report = useQuery({
    queryKey: ["food-cost", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<CostReport>(`/service/food-cost?branchId=${branchId}`),
  });
  const [target, setTarget] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <InventoryTabs />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Food cost</h1>
          <p className="text-sm text-muted-foreground">Recipe cost against the selling price. Suggested price uses the target percent. Nothing changes until you apply it.</p>
        </div>
        <form className="flex gap-2" onSubmit={(event) => {
          event.preventDefault();
          api.post(`/service/food-cost/target?branchId=${branchId}`, { percent: Number(target) })
            .then(() => { toast.success("Target saved"); qc.invalidateQueries({ queryKey: ["food-cost", branchId] }); })
            .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save the target"));
        }}>
          <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder={`Target ${report.data?.targetPercent ?? 30}%`} inputMode="decimal" />
          <Button type="submit" variant="outline">Set target</Button>
        </form>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dish</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Recipe cost</TableHead>
            <TableHead>Food cost %</TableHead>
            <TableHead>Suggested</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(report.data?.items ?? []).map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{formatCurrency(item.price)}</TableCell>
              <TableCell>{item.hasRecipe ? formatCurrency(item.foodCost) : "No recipe"}</TableCell>
              <TableCell>{item.hasRecipe ? `${item.foodCostPercent}%` : "—"}</TableCell>
              <TableCell>{item.hasRecipe ? formatCurrency(item.suggestedPrice) : "—"}</TableCell>
              <TableCell className="text-right">
                <Button type="button" size="sm" variant="outline" disabled={!item.hasRecipe} onClick={() => api.post(`/service/food-cost/${item.id}/apply?branchId=${branchId}`, {}).then(() => { toast.success(`${item.name} price updated`); qc.invalidateQueries({ queryKey: ["food-cost", branchId] }); }).catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not apply"))}>Apply</Button>
                <Link href={`/inventory/cost/${item.id}`} className="ml-2 text-sm underline">History</Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
