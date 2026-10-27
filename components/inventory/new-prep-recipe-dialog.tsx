"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { useCreatePrepRecipe, useIngredients } from "@/hooks/use-inventory";
import { ApiError } from "@/lib/api";

interface Row {
  ingredientId: string;
  quantity: string;
}

export function NewPrepRecipeDialog({ branchId }: { branchId: string | null }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [outputIngredientId, setOutputIngredientId] = useState("");
  const [outputQuantity, setOutputQuantity] = useState("");
  const [rows, setRows] = useState<Row[]>([{ ingredientId: "", quantity: "" }]);
  const { data: ingredients } = useIngredients(branchId);
  const create = useCreatePrepRecipe(branchId);

  const canSubmit =
    name.trim() &&
    outputIngredientId &&
    Number(outputQuantity) > 0 &&
    rows.every((row) => row.ingredientId && Number(row.quantity) > 0);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    create.mutate(
      {
        name: name.trim(),
        outputIngredientId,
        outputQuantity: Number(outputQuantity),
        lines: rows.map((row) => ({
          ingredientId: row.ingredientId,
          quantity: Number(row.quantity),
        })),
      },
      {
        onSuccess: (recipe) => {
          toast.success(`${recipe.name} saved`);
          setOpen(false);
          setName("");
          setOutputIngredientId("");
          setOutputQuantity("");
          setRows([{ ingredientId: "", quantity: "" }]);
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not save prep recipe"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">New prep recipe</Button>} />
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Prep recipe</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Convert raw ingredients into a stock item you already created (name it on Ingredients).
            Recipes later consume that stock item.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="prep-name">Name</Label>
            <Input id="prep-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label>Finished stock item</Label>
              <Select value={outputIngredientId} onValueChange={(v) => setOutputIngredientId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Output" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prep-out">Yield of one batch</Label>
              <Input
                id="prep-out"
                type="number"
                min="0.001"
                step="0.001"
                value={outputQuantity}
                onChange={(e) => setOutputQuantity(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Raw inputs per batch</Label>
            {rows.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={row.ingredientId}
                  onValueChange={(v) =>
                    setRows((prev) =>
                      prev.map((r, i) => (i === index ? { ...r, ingredientId: v ?? "" } : r)),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients
                      ?.filter((item) => item.id !== outputIngredientId)
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0.001"
                  step="0.001"
                  className="w-24"
                  value={row.quantity}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r, i) => (i === index ? { ...r, quantity: e.target.value } : r)),
                    )
                  }
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                  disabled={rows.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setRows((prev) => [...prev, { ingredientId: "", quantity: "" }])}
            >
              <Plus className="size-4" /> Add input
            </Button>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!canSubmit || create.isPending}>
              Save recipe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
