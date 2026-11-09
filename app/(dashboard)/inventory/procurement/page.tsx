"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { CreateInvoiceDialog } from "@/components/inventory/create-invoice-dialog";
import { CreatePurchaseRequestDialog } from "@/components/inventory/create-purchase-request-dialog";
import { CreateQuotationDialog } from "@/components/inventory/create-quotation-dialog";
import { RecordPaymentDialog } from "@/components/inventory/record-payment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useCancelSupplierInvoice,
  useDeletePurchaseRequest,
  useDeleteQuotation,
  usePurchaseRequests,
  useQuotations,
  useSupplierInvoices,
  useUpdatePurchaseRequestStatus,
  useUpdateQuotationStatus,
  type PurchaseRequest,
  type SupplierInvoice,
  type SupplierQuotation,
} from "@/hooks/use-inventory";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

const REQUEST_NEXT: Record<PurchaseRequest["status"], PurchaseRequest["status"][]> = {
  DRAFT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
  CONVERTED: [],
};

const QUOTATION_NEXT: Record<SupplierQuotation["status"], SupplierQuotation["status"][]> = {
  DRAFT: ["RECEIVED"],
  RECEIVED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: [],
};

const INVOICE_BADGE: Record<SupplierInvoice["status"], "default" | "secondary" | "outline" | "destructive"> = {
  UNPAID: "outline",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
};

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PurchaseRequestsSection({ branchId }: { branchId: string | null }) {
  const { data: requests, isLoading } = usePurchaseRequests(branchId);
  const updateStatus = useUpdatePurchaseRequestStatus(branchId);
  const remove = useDeletePurchaseRequest(branchId);
  const [editing, setEditing] = useState<PurchaseRequest | null>(null);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Purchase requests</h2>
          <p className="text-xs text-muted-foreground">Staff-raised requests, awaiting approval before a PO is cut</p>
        </div>
        <CreatePurchaseRequestDialog
          branchId={branchId}
          editing={editing}
          onCloseEdit={() => setEditing(null)}
        />
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : requests && requests.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request #</TableHead>
              <TableHead>Requested by</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => {
              const next = REQUEST_NEXT[r.status];
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-foreground">{r.requestNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{r.requestedBy.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.items.length}</TableCell>
                  <TableCell className="w-48">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {r.status === "DRAFT" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={remove.isPending}
                            onClick={() => {
                              if (!window.confirm(`Delete draft ${r.requestNumber}?`)) return;
                              remove.mutate(r.id, {
                                onSuccess: () => toast.success(`${r.requestNumber} deleted`),
                                onError: (err) =>
                                  toast.error(
                                    err instanceof ApiError ? err.message : "Could not delete request",
                                  ),
                              });
                            }}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      {next.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            {next.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => updateStatus.mutate({ id: r.id, status })}
                              >
                                Move to {status.replace("_", " ").toLowerCase()}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          title="No purchase requests yet"
          description="Staff can raise a request here before a purchase order is cut."
        />
      )}
    </Card>
  );
}

function QuotationsSection({ branchId }: { branchId: string | null }) {
  const { data: quotations, isLoading } = useQuotations(branchId);
  const updateStatus = useUpdateQuotationStatus(branchId);
  const remove = useDeleteQuotation(branchId);
  const [editing, setEditing] = useState<SupplierQuotation | null>(null);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Supplier quotations</h2>
          <p className="text-xs text-muted-foreground">Compare prices across suppliers before ordering</p>
        </div>
        <CreateQuotationDialog
          branchId={branchId}
          editing={editing}
          onCloseEdit={() => setEditing(null)}
        />
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : quotations && quotations.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.map((q) => {
              const next = QUOTATION_NEXT[q.status];
              return (
                <TableRow key={q.id}>
                  <TableCell className="font-medium text-foreground">{q.quotationNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{q.supplier.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{q.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{q.items.length}</TableCell>
                  <TableCell className="w-48">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {q.status === "DRAFT" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditing(q)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={remove.isPending}
                            onClick={() => {
                              if (!window.confirm(`Delete draft ${q.quotationNumber}?`)) return;
                              remove.mutate(q.id, {
                                onSuccess: () => toast.success(`${q.quotationNumber} deleted`),
                                onError: (err) =>
                                  toast.error(
                                    err instanceof ApiError ? err.message : "Could not delete quotation",
                                  ),
                              });
                            }}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      {next.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            {next.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => updateStatus.mutate({ id: q.id, status })}
                              >
                                Mark {status.toLowerCase()}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          title="No quotations recorded yet"
          description="Log a supplier's quoted price to compare it against others for the same ingredient."
        />
      )}
    </Card>
  );
}

function SupplierInvoicesSection({ branchId }: { branchId: string | null }) {
  const { data: invoices, isLoading } = useSupplierInvoices(branchId);
  const cancelInvoice = useCancelSupplierInvoice(branchId);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Vendor invoices</h2>
          <p className="text-xs text-muted-foreground">Track what suppliers have billed and what&apos;s been paid</p>
        </div>
        <CreateInvoiceDialog branchId={branchId} />
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : invoices && invoices.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium text-foreground">{inv.invoiceNumber}</TableCell>
                <TableCell className="text-muted-foreground">{inv.supplier.name}</TableCell>
                <TableCell>
                  <Badge variant={INVOICE_BADGE[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(Number(inv.totalAmount))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(Number(inv.amountPaid))}
                </TableCell>
                <TableCell className="w-48">
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {(inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID") && (
                      <RecordPaymentDialog branchId={branchId} invoice={inv} />
                    )}
                    {inv.status !== "CANCELLED" && inv.status !== "PAID" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={cancelInvoice.isPending}
                        onClick={() => {
                          if (!window.confirm(`Cancel invoice ${inv.invoiceNumber}?`)) return;
                          cancelInvoice.mutate(inv.id, {
                            onSuccess: () => toast.success(`${inv.invoiceNumber} cancelled`),
                            onError: (err) =>
                              toast.error(
                                err instanceof ApiError ? err.message : "Could not cancel invoice",
                              ),
                          });
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
        <EmptyState
          title="No vendor invoices yet"
          description="Add an invoice a supplier has billed you to start tracking payments against it."
        />
      )}
    </Card>
  );
}

export default function ProcurementPage() {
  const { branchId } = useBranch();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <PurchaseRequestsSection branchId={branchId} />
        <QuotationsSection branchId={branchId} />
        <SupplierInvoicesSection branchId={branchId} />
      </div>
    </div>
  );
}
