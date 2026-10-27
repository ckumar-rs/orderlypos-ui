"use client";

import { useQueryClient } from "@tanstack/react-query";
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
import { useIngredients, useSuppliers } from "@/hooks/use-inventory";
import { api, ApiError } from "@/lib/api";

export function PurchaseReturnDialog({ branchId }: { branchId: string | null }) {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const queryClient = useQueryClient();
  const { data: suppliers } = useSuppliers(branchId);
  const { data: ingredients } = useIngredients(branchId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId || !supplierId || !ingredientId) return;
    setPending(true);
    try {
      const result = await api.post<{ emailed: boolean }>(
        `/inventory/purchase-returns?branchId=${branchId}`,
        {
          supplierId,
          reason,
          items: [{ ingredientId, quantity: Number(quantity) }],
        },
      );
      toast.success(
        result.emailed
          ? "Return saved and emailed to the supplier"
          : "Return saved. Stock was reduced. No email was sent.",
      );
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setOpen(false);
      setReason("");
      setQuantity("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the return");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline">Return to supplier</Button>} />
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Purchase return</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ret-supplier">Supplier</Label>
            <select id="ret-supplier" required value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
              <option value="">Choose</option>
              {(suppliers ?? []).map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ret-item">Ingredient</Label>
            <select id="ret-item" required value={ingredientId} onChange={(e) => setIngredientId(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
              <option value="">Choose</option>
              {(ingredients ?? []).map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name} ({ingredient.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ret-qty">Quantity in stock units</Label>
            <Input id="ret-qty" type="number" min="0.001" step="any" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ret-reason">Reason</Label>
            <Input id="ret-reason" required maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save return"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
