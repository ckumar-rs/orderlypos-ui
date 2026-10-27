"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CustomerTabs } from "@/components/customers/customer-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface LoyaltyView {
  rule: {
    earnPerCurrency: number | null;
    pointValue: string | null;
    maxEarnPerOrder: number | null;
    maxRedeemPerOrder: number | null;
    expiryDays: number | null;
    eligibleMenuItemIds: string[];
    cashbackPercent: string;
    cashbackCap: string | null;
  } | null;
  defaults: { earnPerCurrency: number; pointValue: string };
  menuItems: { id: string; name: string }[];
}

export default function LoyaltyRulesPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const view = useQuery({
    queryKey: ["loyalty-rule", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<LoyaltyView>(`/customers/loyalty-rule?branchId=${branchId}`),
  });
  const [earn, setEarn] = useState("");
  const [pointValue, setPointValue] = useState("");
  const [maxEarn, setMaxEarn] = useState("");
  const [maxRedeem, setMaxRedeem] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cashback, setCashback] = useState("");
  const [cap, setCap] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!view.data || ready) return;
    const rule = view.data.rule;
    setEarn(rule?.earnPerCurrency?.toString() ?? "");
    setPointValue(rule?.pointValue ?? "");
    setMaxEarn(rule?.maxEarnPerOrder?.toString() ?? "");
    setMaxRedeem(rule?.maxRedeemPerOrder?.toString() ?? "");
    setExpiry(rule?.expiryDays?.toString() ?? "");
    setCashback(rule ? String(Number(rule.cashbackPercent)) : "");
    setCap(rule?.cashbackCap ?? "");
    setSelected(rule?.eligibleMenuItemIds ?? []);
    setReady(true);
  }, [view.data, ready]);

  const save = () => {
    api
      .post(`/customers/loyalty-rule?branchId=${branchId}`, {
        earnPerCurrency: earn === "" ? null : Number(earn),
        pointValue: pointValue === "" ? null : Number(pointValue),
        maxEarnPerOrder: maxEarn === "" ? null : Number(maxEarn),
        maxRedeemPerOrder: maxRedeem === "" ? null : Number(maxRedeem),
        expiryDays: expiry === "" ? null : Number(expiry),
        eligibleMenuItemIds: selected,
        cashbackPercent: cashback === "" ? 0 : Number(cashback),
        cashbackCap: cap === "" ? null : Number(cap),
      })
      .then(() => {
        toast.success("Loyalty rule saved");
        setReady(false);
        qc.invalidateQueries({ queryKey: ["loyalty-rule", branchId] });
      })
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save the rule"));
  };

  const defaults = view.data?.defaults;

  return (
    <div className="flex flex-col gap-4">
      <CustomerTabs />
      <div>
        <h1 className="text-2xl font-semibold">Loyalty rules</h1>
        <p className="text-sm text-muted-foreground">
          Blank earn rate and point value keep the restaurant settings
          {defaults ? ` (${defaults.earnPerCurrency} spent per point, ${defaults.pointValue} per redeemed point)` : ""}.
          A cashback percent fills a separate wallet. Eligible dishes limit both earn and cashback.
        </p>
      </div>
      <form
        className="grid max-w-3xl gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          Spend per point
          <Input value={earn} onChange={(event) => setEarn(event.target.value)} inputMode="numeric" placeholder="Restaurant default" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Value of one point
          <Input value={pointValue} onChange={(event) => setPointValue(event.target.value)} inputMode="decimal" placeholder="Restaurant default" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Max points earned per bill
          <Input value={maxEarn} onChange={(event) => setMaxEarn(event.target.value)} inputMode="numeric" placeholder="No cap" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Max points redeemed per bill
          <Input value={maxRedeem} onChange={(event) => setMaxRedeem(event.target.value)} inputMode="numeric" placeholder="No cap" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Points expire after days
          <Input value={expiry} onChange={(event) => setExpiry(event.target.value)} inputMode="numeric" placeholder="Never" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Cashback percent
          <Input value={cashback} onChange={(event) => setCashback(event.target.value)} inputMode="decimal" placeholder="0" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Cashback cap per bill
          <Input value={cap} onChange={(event) => setCap(event.target.value)} inputMode="decimal" placeholder="No cap" />
        </label>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm">Eligible dishes</p>
          <div className="max-h-48 overflow-auto rounded-md border border-border p-2">
            {(view.data?.menuItems ?? []).map((item) => (
              <label key={item.id} className="flex items-center gap-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                    )
                  }
                />
                {item.name}
              </label>
            ))}
            {view.data && view.data.menuItems.length === 0 && (
              <p className="text-sm text-muted-foreground">No dishes on this branch. An empty list earns on the whole bill.</p>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Leave every dish unchecked to earn on the whole bill.</p>
        </div>
        <Button type="submit" className="w-fit">Save rule</Button>
      </form>
    </div>
  );
}
