"use client";

import { Gift, Pencil, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { CustomerTabs } from "@/components/customers/customer-tabs";
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { useCustomers, useDeleteCustomer, type Customer } from "@/hooks/use-customers";
import { api, ApiError } from "@/lib/api";

export default function CustomersPage() {
  const { branchId } = useBranch();
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useCustomers(branchId, search || undefined);
  const deleteCustomer = useDeleteCustomer(branchId);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const queryClient = useQueryClient();
  const { data: tiers } = useQuery({
    queryKey: ["customers", "tiers", branchId],
    queryFn: () => api.get<{ id: string; name: string; minPoints: number; earnMultiplier: string }[]>(`/customers/tiers?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const [tierName, setTierName] = useState("");
  const [tierPoints, setTierPoints] = useState("0");
  const [tierMultiplier, setTierMultiplier] = useState("1");
  const createTier = useMutation({
    mutationFn: () =>
      api.post(`/customers/tiers?branchId=${branchId}`, {
        name: tierName,
        minPoints: Number(tierPoints) || 0,
        earnMultiplier: Number(tierMultiplier) || 1,
      }),
    onSuccess: () => {
      toast.success("Tier saved");
      setTierName("");
      queryClient.invalidateQueries({ queryKey: ["customers", "tiers", branchId] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save the tier"),
  });

  const onDelete = (e: React.MouseEvent, customer: Customer) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete ${customer.name ?? "this customer"}? This cannot be undone.`)) return;
    deleteCustomer.mutate(customer.id, {
      onSuccess: () => toast.success(`${customer.name ?? "Customer"} deleted`),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not delete customer"),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <CustomerTabs />
      <Card className="flex flex-col gap-3 p-4">
        <p className="text-sm font-medium text-foreground">Membership tiers</p>
        <p className="text-xs text-muted-foreground">
          The highest tier a guest&apos;s points reach is used at checkout. The multiplier changes how fast they earn.
        </p>
        {(tiers ?? []).map((tier) => (
          <p key={tier.id} className="text-sm text-muted-foreground">
            {tier.name} · from {tier.minPoints} pts · {Number(tier.earnMultiplier)}×
          </p>
        ))}
        <form
          className="grid gap-2 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            createTier.mutate();
          }}
        >
          <Input aria-label="Tier name" placeholder="Gold" value={tierName} onChange={(e) => setTierName(e.target.value)} required />
          <Input aria-label="Minimum points" type="number" min="0" value={tierPoints} onChange={(e) => setTierPoints(e.target.value)} />
          <Input aria-label="Earn multiplier" type="number" min="0.1" step="0.1" value={tierMultiplier} onChange={(e) => setTierMultiplier(e.target.value)} />
          <Button type="submit" disabled={createTier.isPending}>Add tier</Button>
        </form>
      </Card>
      <RfmCard branchId={branchId} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">Profiles, loyalty, and order history</p>
        </div>
        <AddCustomerDialog branchId={branchId} />
      </div>

      <Input
        placeholder="Search by name, phone, or email…"
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
        ) : customers && customers.length > 0 ? (
          customers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-secondary"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {c.name ?? "Unnamed customer"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {[c.phone, c.email].filter(Boolean).join(" · ") || "No contact info"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  {c.loyaltyPoints} pts
                  {c.tier ? ` · ${c.tier.name}` : ""}
                </span>
                {c.rfmScore && (
                  <span>
                    RFM {c.rfmScore}
                    {c.rfmSegment ? ` · ${c.rfmSegment}` : ""}
                  </span>
                )}
                {Number(c.clvEstimate ?? 0) > 0 && <span>CLV ₹{c.clvEstimate}</span>}
                {c.referralCode && <span className="font-mono">{c.referralCode}</span>}
                {Number(c.walletBalance) > 0 && (
                  <span className="flex items-center gap-1">
                    <Gift className="h-3.5 w-3.5" />₹{c.walletBalance}
                  </span>
                )}
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    title="Edit customer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingCustomer(c);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Delete customer"
                    onClick={(e) => onDelete(e, c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No customers yet</p>
            <p className="text-sm text-muted-foreground">
              Add a profile to start tracking loyalty and order history.
            </p>
          </div>
        )}
      </Card>

      {editingCustomer && (
        <EditCustomerDialog
          branchId={branchId}
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )}
    </div>
  );
}

function RfmCard({ branchId }: { branchId: string | null }) {
  const queryClient = useQueryClient();
  const { data: labels } = useQuery({
    queryKey: ["customers", "rfm-labels", branchId],
    queryFn: () =>
      api.get<
        {
          id: string;
          name: string;
          minR: number;
          maxR: number;
          minF: number;
          maxF: number;
          minM: number;
          maxM: number;
          sortOrder: number;
        }[]
      >(`/customers/rfm/labels?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const [name, setName] = useState("");
  const [minR, setMinR] = useState("4");
  const [maxR, setMaxR] = useState("5");
  const [minF, setMinF] = useState("4");
  const [maxF, setMaxF] = useState("5");
  const [minM, setMinM] = useState("4");
  const [maxM, setMaxM] = useState("5");
  const createLabel = useMutation({
    mutationFn: () =>
      api.post(`/customers/rfm/labels?branchId=${branchId}`, {
        name,
        minR: Number(minR),
        maxR: Number(maxR),
        minF: Number(minF),
        maxF: Number(maxF),
        minM: Number(minM),
        maxM: Number(maxM),
      }),
    onSuccess: () => {
      toast.success("RFM label saved");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["customers", "rfm-labels", branchId] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save the label"),
  });
  const refresh = useMutation({
    mutationFn: () => api.post(`/customers/rfm/refresh?branchId=${branchId}`, {}),
    onSuccess: () => {
      toast.success("RFM and CLV recomputed");
      queryClient.invalidateQueries({ queryKey: ["customers", branchId] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not recompute RFM"),
  });
  const removeLabel = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/rfm/labels/${id}?branchId=${branchId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "rfm-labels", branchId] });
    },
  });

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">RFM and customer lifetime value</p>
          <p className="text-xs text-muted-foreground">
            Recency, frequency, and spend scores are 1–5 from this branch&apos;s paid bills. CLV uses
            the horizon and margin saved in Operations.
          </p>
        </div>
        <Button type="button" variant="outline" disabled={!branchId || refresh.isPending} onClick={() => refresh.mutate()}>
          Recompute RFM
        </Button>
      </div>
      {(labels ?? []).map((label) => (
        <div key={label.id} className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {label.name} · R {label.minR}–{label.maxR} · F {label.minF}–{label.maxF} · M {label.minM}–
            {label.maxM}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => removeLabel.mutate(label.id)}>
            Remove
          </Button>
        </div>
      ))}
      <form
        className="grid gap-2 sm:grid-cols-8"
        onSubmit={(e) => {
          e.preventDefault();
          createLabel.mutate();
        }}
      >
        <Input aria-label="RFM label name" placeholder="Champions" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input aria-label="Min R" type="number" min="1" max="5" value={minR} onChange={(e) => setMinR(e.target.value)} />
        <Input aria-label="Max R" type="number" min="1" max="5" value={maxR} onChange={(e) => setMaxR(e.target.value)} />
        <Input aria-label="Min F" type="number" min="1" max="5" value={minF} onChange={(e) => setMinF(e.target.value)} />
        <Input aria-label="Max F" type="number" min="1" max="5" value={maxF} onChange={(e) => setMaxF(e.target.value)} />
        <Input aria-label="Min M" type="number" min="1" max="5" value={minM} onChange={(e) => setMinM(e.target.value)} />
        <Input aria-label="Max M" type="number" min="1" max="5" value={maxM} onChange={(e) => setMaxM(e.target.value)} />
        <Button type="submit" disabled={createLabel.isPending}>Add label</Button>
      </form>
    </Card>
  );
}
