"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrepRecipes, useRecordPrepBatch } from "@/hooks/use-inventory";
import { ApiError } from "@/lib/api";

export function RecordPrepBatchDialog({ branchId }: { branchId: string | null }) {
  const [open, setOpen] = useState(false);
  const [recipeId, setRecipeId] = useState("");
  const [multiplier, setMultiplier] = useState("1");
  const [produced, setProduced] = useState("");
  const { data: recipes } = usePrepRecipes(branchId);
  const record = useRecordPrepBatch(branchId);
  const recipe = recipes?.find((item) => item.id === recipeId);
  const theoretical = useMemo(() => {
    if (!recipe) return 0;
    return Number(recipe.outputQuantity) * Number(multiplier || 0);
  }, [recipe, multiplier]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeId || Number(multiplier) <= 0 || Number(produced) <= 0) return;
    record.mutate(
      {
        prepRecipeId: recipeId,
        batchMultiplier: Number(multiplier),
        quantityProduced: Number(produced),
      },
      {
        onSuccess: (batch) => {
          toast.success(`${batch.batchNumber} recorded · yield ${batch.yieldPct}%`);
          setOpen(false);
          setRecipeId("");
          setMultiplier("1");
          setProduced("");
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not record batch"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Record batch</Button>} />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Kitchen prep batch</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label>Recipe</Label>
            <Select
              value={recipeId}
              onValueChange={(v) => {
                setRecipeId(v ?? "");
                const next = recipes?.find((item) => item.id === v);
                if (next) setProduced(String(Number(next.outputQuantity) * Number(multiplier || 1)));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick a prep recipe" />
              </SelectTrigger>
              <SelectContent>
                {recipes?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mult">Batches cooked</Label>
              <Input
                id="mult"
                type="number"
                min="0.001"
                step="0.001"
                value={multiplier}
                onChange={(e) => {
                  setMultiplier(e.target.value);
                  if (recipe) {
                    setProduced(String(Number(recipe.outputQuantity) * Number(e.target.value || 0)));
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prod">Actual yield</Label>
              <Input
                id="prod"
                type="number"
                min="0.001"
                step="0.001"
                value={produced}
                onChange={(e) => setProduced(e.target.value)}
              />
            </div>
          </div>
          {recipe && (
            <p className="text-xs text-muted-foreground">
              Recipe yield {theoretical} {recipe.outputIngredient.unit} of {recipe.outputIngredient.name}.
              Inputs are consumed at the full recipe qty (not scaled down if actual yield is short).
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={record.isPending || !recipeId}>
              Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
