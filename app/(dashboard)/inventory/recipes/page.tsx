"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { useIngredients } from "@/hooks/use-inventory";
import { useMenuItems } from "@/hooks/use-menu";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

const UNITS = ["KG", "G", "L", "ML", "PIECE", "DOZEN", "PACK", "BOX"];

interface RecipeLine {
  ingredientId: string;
  quantity: string;
  unit: string;
}

interface RecipeDetail {
  servings: number;
  yieldQuantity: number | null;
  yieldUnit: string | null;
  instructions: string | null;
  portionStep: number;
  perServing: number;
  batchCost: number;
  lines: Array<{ ingredientId: string; quantity: number; unit: string }>;
}

export default function RecipesPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const menu = useMenuItems(branchId);
  const ingredients = useIngredients(branchId);
  const summary = useQuery({
    queryKey: ["recipe-summary", branchId],
    enabled: Boolean(branchId),
    queryFn: () =>
      api.get<Array<{ id: string; name: string; servings: number; perServing: number; batchCost: number; lines: number }>>(
        `/inventory/recipes?branchId=${branchId}`,
      ),
  });
  const [itemId, setItemId] = useState("");
  const [servings, setServings] = useState("1");
  const [yieldQuantity, setYieldQuantity] = useState("");
  const [yieldUnit, setYieldUnit] = useState("");
  const [portionStep, setPortionStep] = useState("1");
  const [instructions, setInstructions] = useState("");
  const [lines, setLines] = useState<RecipeLine[]>([]);

  useEffect(() => {
    if (!itemId || !branchId) return;
    api
      .get<RecipeDetail>(`/inventory/menu-items/${itemId}/recipe?branchId=${branchId}`)
      .then((recipe) => {
        setServings(String(recipe.servings || 1));
        setYieldQuantity(recipe.yieldQuantity == null ? "" : String(recipe.yieldQuantity));
        setYieldUnit(recipe.yieldUnit ?? "");
        setPortionStep(String(recipe.portionStep || 1));
        setInstructions(recipe.instructions ?? "");
        setLines(
          recipe.lines.map((line) => ({
            ingredientId: line.ingredientId,
            quantity: String(line.quantity),
            unit: line.unit,
          })),
        );
      })
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not load the recipe"));
  }, [itemId, branchId]);

  return (
    <div className="flex flex-col gap-4">
      <InventoryTabs />
      <div>
        <h1 className="text-2xl font-semibold">Recipes</h1>
        <p className="text-sm text-muted-foreground">
          A recipe is a batch. Food cost and stock use one serving. A half portion uses half a serving. Saving stores the full ingredient list, yield, and instructions.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dish</TableHead>
            <TableHead>Servings</TableHead>
            <TableHead>Lines</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Per serving</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(summary.data ?? []).filter((row) => row.lines > 0).map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <button type="button" className="font-medium" onClick={() => setItemId(row.id)}>
                  {row.name}
                </button>
              </TableCell>
              <TableCell>{row.servings}</TableCell>
              <TableCell>{row.lines}</TableCell>
              <TableCell>{formatCurrency(row.batchCost)}</TableCell>
              <TableCell>{formatCurrency(row.perServing)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <form
        className="flex max-w-3xl flex-col gap-3 rounded-lg border border-border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!itemId) return;
          api
            .patch(`/inventory/menu-items/${itemId}/recipe?branchId=${branchId}`, {
              servings: Number(servings),
              yieldQuantity: yieldQuantity ? Number(yieldQuantity) : null,
              yieldUnit: yieldUnit || null,
              portionStep: Number(portionStep),
              instructions: instructions || null,
              lines: lines
                .filter((line) => line.ingredientId && Number(line.quantity) > 0)
                .map((line) => ({ ingredientId: line.ingredientId, quantity: Number(line.quantity), unit: line.unit })),
            })
            .then(() => {
              toast.success("Recipe saved");
              qc.invalidateQueries({ queryKey: ["recipe-summary", branchId] });
              qc.invalidateQueries({ queryKey: ["recipe-history", branchId, itemId] });
            })
            .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save the recipe"));
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          Dish
          <select className="h-10 rounded-md border border-border bg-background px-2" value={itemId} onChange={(event) => setItemId(event.target.value)}>
            <option value="">Choose a dish</option>
            {(menu.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-2 sm:grid-cols-4">
          <label className="text-sm">Servings<Input value={servings} onChange={(event) => setServings(event.target.value)} inputMode="numeric" /></label>
          <label className="text-sm">Yield<Input value={yieldQuantity} onChange={(event) => setYieldQuantity(event.target.value)} inputMode="decimal" /></label>
          <label className="text-sm">Yield unit<Input value={yieldUnit} onChange={(event) => setYieldUnit(event.target.value)} /></label>
          <label className="text-sm">Portion step<Input value={portionStep} onChange={(event) => setPortionStep(event.target.value)} inputMode="decimal" /></label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Instructions
          <textarea className="min-h-24 rounded-md border border-border bg-background p-2" value={instructions} onChange={(event) => setInstructions(event.target.value)} />
        </label>
        {lines.map((line, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-3">
            <select
              className="h-10 rounded-md border border-border bg-background px-2"
              value={line.ingredientId}
              onChange={(event) => setLines(lines.map((row, i) => (i === index ? { ...row, ingredientId: event.target.value } : row)))}
            >
              <option value="">Ingredient</option>
              {(ingredients.data ?? []).map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </option>
              ))}
            </select>
            <Input
              value={line.quantity}
              inputMode="decimal"
              onChange={(event) => setLines(lines.map((row, i) => (i === index ? { ...row, quantity: event.target.value } : row)))}
            />
            <select
              className="h-10 rounded-md border border-border bg-background px-2"
              value={line.unit}
              onChange={(event) => setLines(lines.map((row, i) => (i === index ? { ...row, unit: event.target.value } : row)))}
            >
              {UNITS.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setLines([...lines, { ingredientId: "", quantity: "", unit: "G" }])}>
            Add ingredient
          </Button>
          <Button type="submit" disabled={!itemId}>Save recipe</Button>
          {itemId ? (
            <Link href={`/inventory/cost/${itemId}`} className="self-center text-sm text-muted-foreground">
              Version history
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}
