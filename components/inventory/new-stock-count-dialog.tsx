"use client";

import { useEffect, useState } from "react";
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
import { useCreateStockCount, useIngredients } from "@/hooks/use-inventory";
import { ApiError } from "@/lib/api";

export function NewStockCountDialog({ branchId }: { branchId: string | null }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [counted, setCounted] = useState<Record<string, string>>({});
  const { data: ingredients } = useIngredients(branchId);
  const create = useCreateStockCount(branchId);

  useEffect(() => {
    if (!open || !ingredients) return;
    setCounted(
      Object.fromEntries(ingredients.filter((i) => i.isActive).map((i) => [i.id, i.currentStock])),
    );
  }, [open, ingredients]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = Object.entries(counted)
      .filter(([, qty]) => qty !== "")
      .map(([ingredientId, qty]) => ({ ingredientId, countedQty: Number(qty) }));
    if (lines.length === 0) return;
    create.mutate(
      { notes: notes || undefined, lines },
      {
        onSuccess: (count) => {
          toast.success(`${count.countNumber} saved as draft`);
          setOpen(false);
          setNotes("");
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not save count"),
      },
    );
  };

  const active = ingredients?.filter((i) => i.isActive) ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">New count</Button>} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Physical stock count</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            System qty is what the ledger expects after recipe deductions. Enter what is on the
            shelf. Post the draft to write the variance.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="count-notes">Notes</Label>
            <Input id="count-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            {active.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_5rem_6rem] items-center gap-2">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    System {item.currentStock} {item.unit}
                  </p>
                </div>
                <span className="text-right text-xs text-muted-foreground">{item.unit}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={counted[item.id] ?? ""}
                  onChange={(e) =>
                    setCounted((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                  required
                />
              </div>
            ))}
            {active.length === 0 && (
              <p className="text-sm text-muted-foreground">Add ingredients first.</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending || active.length === 0}>
              Save draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
