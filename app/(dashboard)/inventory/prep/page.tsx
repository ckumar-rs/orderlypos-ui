"use client";

import { NewPrepRecipeDialog } from "@/components/inventory/new-prep-recipe-dialog";
import { RecordPrepBatchDialog } from "@/components/inventory/record-prep-batch-dialog";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { useDeletePrepRecipe, usePrepBatches, usePrepRecipes } from "@/hooks/use-inventory";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

export default function PrepPage() {
  const { branchId } = useBranch();
  const { data: recipes, isLoading: loadingRecipes } = usePrepRecipes(branchId);
  const { data: batches, isLoading: loadingBatches } = usePrepBatches(branchId);
  const remove = useDeletePrepRecipe(branchId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Cook a prep recipe: consume raw stock, add the finished stock item
          </p>
        </div>
        <div className="flex gap-2">
          <NewPrepRecipeDialog branchId={branchId} />
          <RecordPrepBatchDialog branchId={branchId} />
        </div>
      </div>

      <InventoryTabs />

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3 text-sm font-medium">Prep recipes</div>
        {loadingRecipes ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : recipes && recipes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Output</TableHead>
                <TableHead>Inputs</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell className="font-medium">{recipe.name}</TableCell>
                  <TableCell>
                    {recipe.outputQuantity} {recipe.outputIngredient.unit}{" "}
                    {recipe.outputIngredient.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {recipe.lines
                      .map((line) => `${line.quantity} ${line.ingredient.unit} ${line.ingredient.name}`)
                      .join(", ")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        remove.mutate(recipe.id, {
                          onSuccess: () => toast.success("Recipe removed"),
                          onError: (err) =>
                            toast.error(
                              err instanceof ApiError ? err.message : "Cannot delete this recipe",
                            ),
                        })
                      }
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-4 py-10 text-sm text-muted-foreground">
            No prep recipes. Add the finished item on Ingredients first, then describe the batch
            here.
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3 text-sm font-medium">Batches</div>
        {loadingBatches ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : batches && batches.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Recipe</TableHead>
                <TableHead className="text-right">Produced</TableHead>
                <TableHead className="text-right">Yield %</TableHead>
                <TableHead>By</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                  <TableCell>{batch.prepRecipe.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {batch.quantityProduced} / {batch.theoreticalOutput}{" "}
                    {batch.outputIngredient.unit}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{batch.yieldPct}</TableCell>
                  <TableCell className="text-muted-foreground">{batch.producedBy.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(batch.producedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-4 py-10 text-sm text-muted-foreground">No batches recorded.</div>
        )}
      </Card>
    </div>
  );
}
