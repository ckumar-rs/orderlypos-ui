"use client";

import { ArrowLeft, CreditCard, Gift, Pencil, Star, Trash2, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CustomerTabs } from "@/components/customers/customer-tabs";
import { RecordFields } from "@/components/fields/record-fields";
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { useCustomer, useDeleteCustomer } from "@/hooks/use-customers";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { branchId } = useBranch();
  const { data: customer, isLoading } = useCustomer(branchId, id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const deleteCustomer = useDeleteCustomer(branchId);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading || !customer) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  const onDelete = () => {
    if (!confirm(`Delete ${customer.name ?? "this customer"}? This cannot be undone.`)) return;
    deleteCustomer.mutate(customer.id, {
      onSuccess: () => {
        toast.success(`${customer.name ?? "Customer"} deleted`);
        router.replace("/customers");
      },
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not delete customer"),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <CustomerTabs />
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/customers"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Customers
          </Link>
          <h1 className="mt-2 text-[32px] font-semibold tracking-tight text-foreground">
            {customer.name ?? "Unnamed customer"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {[customer.phone, customer.email, customer.address].filter(Boolean).join(" · ") ||
              "No contact info on file"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Loyalty points</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">
              {customer.loyaltyPoints}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Store credit</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">
              {formatCurrency(customer.walletBalance)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cashback</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">
              {formatCurrency(customer.cashbackBalance ?? 0)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gift cards</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">
              {customer.giftCards.length}
            </p>
          </div>
        </Card>
        <Card className="flex flex-col gap-1 p-5 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Visits and average order
          </p>
          <p className="text-sm text-foreground">
            {customer.metrics && customer.metrics.visits > 0
              ? `${customer.metrics.visits} paid visit${customer.metrics.visits === 1 ? "" : "s"} · AOV ${formatCurrency(customer.metrics.aov)} · spend ${formatCurrency(customer.metrics.spend)}`
              : "No paid visits yet."}
          </p>
          {customer.metrics?.averageDaysBetween != null && (
            <p className="text-sm text-muted-foreground">
              About every {customer.metrics.averageDaysBetween} days
              {customer.metrics.visitsPer30Days != null
                ? ` · ${customer.metrics.visitsPer30Days} visits in 30 days`
                : ""}
            </p>
          )}
        </Card>
        <Card className="flex flex-col gap-1 p-5 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Favorite dishes
          </p>
          {(customer.favorites ?? []).length > 0 ? (
            <ul className="text-sm text-foreground">
              {(customer.favorites ?? []).map((favorite) => (
                <li key={favorite.menuItemId}>
                  {favorite.name} · {favorite.quantity}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No paid dishes yet.</p>
          )}
        </Card>
        <Card className="flex flex-col gap-1 p-5 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Suggested next
          </p>
          {(customer.recommendations ?? []).length > 0 ? (
            <ul className="text-sm text-foreground">
              {(customer.recommendations ?? []).map((dish) => (
                <li key={dish.menuItemId}>
                  {dish.name} · {dish.reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No suggestions yet.</p>
          )}
        </Card>
        <Card className="flex flex-col gap-1 p-5 sm:col-span-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            RFM and lifetime value
          </p>
          {customer.rfmScore ? (
            <p className="text-sm text-foreground">
              Score {customer.rfmScore}
              {customer.rfmSegment ? ` · ${customer.rfmSegment}` : ""}
              {" · "}
              R {customer.rfmRecency} · F {customer.rfmFrequency} · M {customer.rfmMonetary}
              {" · "}
              CLV {formatCurrency(customer.clvEstimate ?? 0)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No paid history yet. Recompute RFM from the customers list after the first paid bill.
            </p>
          )}
        </Card>
      </div>

      {customer.allergies && (
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Allergies
          </p>
          <p className="mt-1 text-sm text-destructive">{customer.allergies}</p>
        </Card>
      )}

      <RecordFields branchId={branchId} entity="CUSTOMER" entityId={customer.id} />

      {customer.giftCards.length > 0 && (
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-[18px] font-medium text-foreground">Gift cards</h2>
          <div className="flex flex-col divide-y divide-border">
            {customer.giftCards.map((gc) => (
              <div key={gc.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-muted-foreground">{gc.code}</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatCurrency(gc.balance)} / {formatCurrency(gc.initialValue)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(customer.rewards ?? []).length > 0 && (
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-[18px] font-medium text-foreground">Reward catalog</h2>
          <div className="flex flex-col divide-y divide-border">
            {(customer.rewards ?? []).map((reward) => (
              <div key={reward.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-foreground">
                  {reward.name}
                  <span className="ml-2 text-muted-foreground">
                    {reward.pointsCost > 0 ? `${reward.pointsCost} pts` : ""}
                    {reward.pointsCost > 0 && Number(reward.cashbackCost) > 0 ? " · " : ""}
                    {Number(reward.cashbackCost) > 0 ? formatCurrency(reward.cashbackCost) : ""}
                  </span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    api
                      .post(`/customers/${customer.id}/rewards/${reward.id}?branchId=${branchId}`, {})
                      .then(() => {
                        toast.success(`${reward.name} redeemed`);
                        queryClient.invalidateQueries({
                          queryKey: ["customers", branchId, "detail", customer.id],
                        });
                      })
                      .catch((err) =>
                        toast.error(err instanceof ApiError ? err.message : "Could not redeem the reward"),
                      )
                  }
                >
                  Redeem
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-[18px] font-medium text-foreground">Order history</h2>
        {customer.orders.length > 0 ? (
          <div className="flex flex-col divide-y divide-border">
            {customer.orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">#{o.orderNumber}</span>
                  <Badge variant="secondary" className="mt-0.5 w-fit text-[11px] font-normal">
                    {new Date(o.billedAt).toLocaleDateString()}
                  </Badge>
                </div>
                <span className="font-medium tabular-nums text-foreground">
                  {formatCurrency(o.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">No paid orders yet.</p>
        )}
      </Card>

      {isEditing && (
        <EditCustomerDialog
          branchId={branchId}
          customer={customer}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
