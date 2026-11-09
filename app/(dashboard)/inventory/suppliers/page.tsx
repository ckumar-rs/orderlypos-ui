"use client";

import { Mail, Phone } from "lucide-react";
import { useState } from "react";
import { RecordFields } from "@/components/fields/record-fields";
import { AddSupplierDialog } from "@/components/inventory/add-supplier-dialog";
import { EditSupplierDialog } from "@/components/inventory/edit-supplier-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { useSuppliers } from "@/hooks/use-inventory";

export default function SuppliersPage() {
  const { branchId } = useBranch();
  const [search, setSearch] = useState("");
  const { data: suppliers, isLoading } = useSuppliers(branchId);
  const [openId, setOpenId] = useState<string | null>(null);
  const openSupplier = suppliers?.find((supplier) => supplier.id === openId) ?? null;

  const filtered = suppliers?.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <AddSupplierDialog branchId={branchId} />
      </div>

      <Input
        placeholder="Search suppliers…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card className="flex flex-col divide-y divide-border p-2">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          filtered.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {s.name}
                  {!s.isActive && <Badge variant="outline">Inactive</Badge>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {s.contactName || "No contact person on file"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <EditSupplierDialog branchId={branchId} supplier={s} />
                <Button type="button" size="sm" variant="outline" onClick={() => setOpenId(s.id)}>
                  Extra fields
                </Button>
                {s.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {s.phone}
                  </span>
                )}
                {s.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {s.email}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No suppliers yet</p>
            <p className="text-sm text-muted-foreground">
              Add a supplier before creating your first purchase order.
            </p>
          </div>
        )}
      </Card>
      <Dialog open={!!openSupplier} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{openSupplier?.name ?? "Supplier"}</DialogTitle>
          </DialogHeader>
          {openSupplier && (
            <>
              <RecordFields branchId={branchId} entity="SUPPLIER" entityId={openSupplier.id} />
              <p className="text-sm text-muted-foreground">
                Fields added under Settings → Fields for suppliers appear here.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
