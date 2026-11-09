"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { AddIngredientDialog } from "@/components/inventory/add-ingredient-dialog";
import { EditIngredientDialog } from "@/components/inventory/edit-ingredient-dialog";
import { PurchaseReturnDialog } from "@/components/inventory/purchase-return-dialog";
import { AdjustStockDialog } from "@/components/inventory/adjust-stock-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { useIngredients, useTrackingStatus } from "@/hooks/use-inventory";
import { formatCurrency } from "@/lib/format";

export default function InventoryPage() {
  const { branchId } = useBranch();
  const [search, setSearch] = useState("");
  const { data: ingredients, isLoading } = useIngredients(branchId);
  const { data: trackingStatus } = useTrackingStatus(branchId);

  const filtered = ingredients?.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <PurchaseReturnDialog branchId={branchId} />
        <AddIngredientDialog branchId={branchId} />
      </div>

      {trackingStatus && trackingStatus.problems.length > 0 && (
        <div role="alert" className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div className="flex flex-col gap-1">
            <p className="font-medium text-foreground">
              {trackingStatus.problems.length} stock-tracked menu item{trackingStatus.problems.length === 1 ? "" : "s"} will deduct nothing when sold
            </p>
            <p className="text-muted-foreground">
              Add a recipe or pick the stock item (Menu → Edit item → Stock when sold):{" "}
              {trackingStatus.problems.map((p) => p.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      <Input
        placeholder="Search ingredients…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Current stock</TableHead>
                <TableHead className="text-right">Reorder level</TableHead>
                <TableHead className="text-right">Avg. cost / unit</TableHead>
                <TableHead className="text-right">Stock value</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => {
                const isLow = Number(i.currentStock) <= Number(i.reorderLevel);
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {i.name}
                        {!i.isActive && <Badge variant="outline">Inactive</Badge>}
                        {isLow && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Low stock
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{i.unit}</TableCell>
                    <TableCell className="text-right tabular-nums">{i.currentStock}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {i.reorderLevel}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(i.costPerUnit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(Number(i.currentStock) * Number(i.costPerUnit))}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <EditIngredientDialog branchId={branchId} ingredient={i} />
                        <AdjustStockDialog branchId={branchId} ingredient={i} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No ingredients yet</p>
            <p className="text-sm text-muted-foreground">
              Add your raw materials to start recipe costing and stock tracking.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
