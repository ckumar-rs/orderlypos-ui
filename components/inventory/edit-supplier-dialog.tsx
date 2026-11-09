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
import {
  useDeleteSupplier,
  useUpdateSupplier,
  type Supplier,
} from "@/hooks/use-inventory";
import { ApiError } from "@/lib/api";

export function EditSupplierDialog({
  branchId,
  supplier,
}: {
  branchId: string | null;
  supplier: Supplier;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(supplier.name);
  const [contactName, setContactName] = useState(supplier.contactName ?? "");
  const [phone, setPhone] = useState(supplier.phone ?? "");
  const [email, setEmail] = useState(supplier.email ?? "");
  const [isActive, setIsActive] = useState(supplier.isActive);
  const update = useUpdateSupplier(branchId);
  const remove = useDeleteSupplier(branchId);

  useEffect(() => {
    if (!open) return;
    setName(supplier.name);
    setContactName(supplier.contactName ?? "");
    setPhone(supplier.phone ?? "");
    setEmail(supplier.email ?? "");
    setIsActive(supplier.isActive);
  }, [open, supplier]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    update.mutate(
      {
        id: supplier.id,
        dto: {
          name: name.trim(),
          contactName: contactName.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          isActive,
        },
      },
      {
        onSuccess: () => {
          toast.success(`${name.trim()} updated`);
          setOpen(false);
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not update supplier"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline">Edit</Button>} />
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit supplier</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="es-name">Business name</Label>
            <Input id="es-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="es-contact">Contact person</Label>
            <Input
              id="es-contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="es-phone">Phone</Label>
            <Input id="es-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="es-email">Email</Label>
            <Input
              id="es-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              disabled={remove.isPending || update.isPending}
              onClick={() => {
                if (!window.confirm(`Remove ${supplier.name}?`)) return;
                remove.mutate(supplier.id, {
                  onSuccess: (res) => {
                    toast.success(
                      res.deactivated
                        ? `${supplier.name} deactivated (has purchase orders)`
                        : `${supplier.name} deleted`,
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
