"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CreatePoDialog } from "@/components/inventory/create-po-dialog";
import { Badge } from "@/components/ui/badge";
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
import {
  usePurchaseOrders,
  useUpdatePurchaseOrderStatus,
  type PurchaseOrder,
} from "@/hooks/use-inventory";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

const STATUS_VARIANT: Record<PurchaseOrder["status"], "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  SENT: "outline",
  PARTIALLY_RECEIVED: "outline",
  RECEIVED: "default",
  CANCELLED: "destructive",
};

export default function PurchaseOrdersPage() {
  const { branchId } = useBranch();
  const { data: orders, isLoading } = usePurchaseOrders(branchId);
  const updateStatus = useUpdatePurchaseOrderStatus(branchId);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <CreatePoDialog branchId={branchId} />
      </div>

      <CreatePoDialog
        branchId={branchId}
        purchaseOrder={editing}
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell>
                    <Link
                      href={`/inventory/purchase-orders/${po.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {po.poNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{po.supplier.name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[po.status]}>{po.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{po.items.length}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(po.totalAmount)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(po.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {po.status === "DRAFT" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing(po)}
                        >
                          Edit
                        </Button>
                      )}
                      {(po.status === "DRAFT" || po.status === "SENT") && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={updateStatus.isPending}
                          onClick={() => {
                            if (!window.confirm(`Cancel ${po.poNumber}?`)) return;
                            updateStatus.mutate(
                              { id: po.id, status: "CANCELLED" },
                              {
                                onSuccess: () => toast.success(`${po.poNumber} cancelled`),
                                onError: (err) =>
                                  toast.error(
                                    err instanceof ApiError ? err.message : "Could not cancel PO",
                                  ),
                              },
                            );
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No purchase orders yet</p>
            <p className="text-sm text-muted-foreground">
              Create one to start tracking what you&apos;ve ordered from suppliers.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
