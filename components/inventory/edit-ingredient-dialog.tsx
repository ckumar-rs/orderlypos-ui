"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { IngredientUnit } from "@nodedr-restaurant/types";
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
import {
  useDeleteIngredient,
  useUpdateIngredient,
  type Ingredient,
} from "@/hooks/use-inventory";
import { ApiError } from "@/lib/api";

const UNITS: IngredientUnit[] = ["KG", "G", "L", "ML", "PIECE", "DOZEN", "PACK", "BOX"];

export function EditIngredientDialog({
  branchId,
  ingredient,
}: {
  branchId: string | null;
  ingredient: Ingredient;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(ingredient.name);
  const [unit, setUnit] = useState<IngredientUnit>(ingredient.unit);
  const [reorderLevel, setReorderLevel] = useState(String(ingredient.reorderLevel));
  const [leadTimeDays, setLeadTimeDays] = useState(
    ingredient.leadTimeDays == null ? "" : String(ingredient.leadTimeDays),
  );
  const [purchaseToBase, setPurchaseToBase] = useState(
    String(ingredient.purchaseToBase ?? "1"),
  );
  const [isActive, setIsActive] = useState(ingredient.isActive);
  const update = useUpdateIngredient(branchId);
  const remove = useDeleteIngredient(branchId);

  useEffect(() => {
    if (!open) return;
    setName(ingredient.name);
    setUnit(ingredient.unit);
    setReorderLevel(String(ingredient.reorderLevel));
    setLeadTimeDays(ingredient.leadTimeDays == null ? "" : String(ingredient.leadTimeDays));
    setPurchaseToBase(String(ingredient.purchaseToBase ?? "1"));
    setIsActive(ingredient.isActive);
  }, [open, ingredient]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    update.mutate(
      {
        id: ingredient.id,
        dto: {
          name: name.trim(),
          unit,
          reorderLevel: Number(reorderLevel) || 0,
          leadTimeDays: leadTimeDays === "" ? null : Number(leadTimeDays),
          purchaseToBase: Number(purchaseToBase) || 1,
          isActive,
        },
      },
      {
        onSuccess: () => {
          toast.success(`${name.trim()} updated`);
          setOpen(false);
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not update ingredient"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline">Edit</Button>} />
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit ingredient</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ei-name">Name</Label>
            <Input id="ei-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Unit</Label>
            <Select value={unit} onValueChange={(v) => setUnit(v as IngredientUnit)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ei-factor">Stock units per purchase unit</Label>
            <Input
              id="ei-factor"
              type="number"
              min="0.001"
              step="any"
              value={purchaseToBase}
              onChange={(e) => setPurchaseToBase(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ei-reorder">Reorder level</Label>
            <Input
              id="ei-reorder"
              type="number"
              min="0"
              step="0.001"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ei-lead">Lead time days (optional)</Label>
            <Input
              id="ei-lead"
              type="number"
              min="0"
              step="0.5"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active (shown for ordering and recipes)
          </label>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              disabled={remove.isPending || update.isPending}
              onClick={() => {
                if (!window.confirm(`Remove ${ingredient.name}?`)) return;
                remove.mutate(ingredient.id, {
                  onSuccess: (res) => {
                    toast.success(
                      res.deactivated
                        ? `${ingredient.name} deactivated (still used in recipes)`
                        : `${ingredient.name} deleted`,
                    );
                    setOpen(false);
                  },
                  onError: (err) =>
                    toast.error(err instanceof ApiError ? err.message : "Could not delete"),
                });
              }}
            >
              {remove.isPending ? "Removing…" : "Delete"}
            </Button>
            <Button type="submit" disabled={update.isPending || remove.isPending}>
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
