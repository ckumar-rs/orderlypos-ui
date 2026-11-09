"use client";

import { Plus, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useCreateQuotation,
  useIngredients,
  useSuppliers,
  useUpdateQuotation,
  type SupplierQuotation,
} from "@/hooks/use-inventory";
import { ApiError } from "@/lib/api";

interface Row {
  ingredientId: string;
  quantityQuoted: string;
  unitPrice: string;
}

const emptyRow: Row = { ingredientId: "", quantityQuoted: "", unitPrice: "" };

export function CreateQuotationDialog({
  branchId,
  editing = null,
  onCloseEdit,
}: {
  branchId: string | null;
  editing?: SupplierQuotation | null;
  onCloseEdit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const { data: suppliers } = useSuppliers(branchId);
  const { data: ingredients } = useIngredients(branchId);
  const createQuotation = useCreateQuotation(branchId);
  const updateQuotation = useUpdateQuotation(branchId);
  const isEdit = Boolean(editing);

  useEffect(() => {
    if (!editing) return;
    setSupplierId(editing.supplier.id);
    setRows(
      editing.items.length > 0
        ? editing.items.map((item) => ({
            ingredientId: item.ingredientId,
            quantityQuoted: String(Number(item.quantityQuoted)),
            unitPrice: String(Number(item.unitPrice)),
          }))
        : [{ ...emptyRow }],
    );
    setOpen(true);
  }, [editing]);

  const reset = () => {
    setSupplierId("");
    setRows([{ ...emptyRow }]);
  };

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      reset();
      onCloseEdit?.();
    }
  };

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const canSubmit =
    !!supplierId &&
    rows.length > 0 &&
    rows.every((r) => r.ingredientId && Number(r.quantityQuoted) > 0 && Number(r.unitPrice) >= 0);
  const pending = createQuotation.isPending || updateQuotation.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const dto = {
      supplierId,
      items: rows.map((r) => ({
        ingredientId: r.ingredientId,
        quantityQuoted: Number(r.quantityQuoted),
        unitPrice: Number(r.unitPrice),
      })),
    };
    if (editing) {
      updateQuotation.mutate(
        { id: editing.id, dto },
        {
          onSuccess: (quotation) => {
            toast.success(`${quotation.quotationNumber} updated`);
            close(false);
          },
          onError: (err) =>
            toast.error(err instanceof ApiError ? err.message : "Could not update quotation"),
        },
      );
      return;
    }
    createQuotation.mutate(dto, {
      onSuccess: (quotation) => {
        toast.success(`${quotation.quotationNumber} recorded`);
        close(false);
      },
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not record quotation"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      {!editing && <DialogTrigger render={<Button size="sm">New quotation</Button>} />}
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? `Edit ${editing?.quotationNumber}` : "Record a supplier quotation"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Items quoted</Label>
            <div className="flex flex-col gap-2">
              {rows.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={row.ingredientId}
                    onValueChange={(v) => updateRow(index, { ingredientId: v ?? "" })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients?.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name} ({i.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="Qty"
                    className="w-20"
                    value={row.quantityQuoted}
                    onChange={(e) => updateRow(index, { quantityQuoted: e.target.value })}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price/unit"
                    className="w-24"
                    value={row.unitPrice}
                    onChange={(e) => updateRow(index, { unitPrice: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={rows.length === 1}
                    onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit gap-1"
              onClick={() => setRows((prev) => [...prev, { ...emptyRow }])}
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit || pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Save quotation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
