"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCustomers } from "@/hooks/use-customers";
import { useMenuItems } from "@/hooks/use-menu";
import { useBranch } from "@/hooks/use-branch";
import { useMarketingActions, usePromotions, type PromotionRow } from "@/hooks/use-marketing";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

function summary(row: PromotionRow, customerName: string, bundleName: string) {
  const parts = [`${row.kind === "FLAT" ? row.value : `${Number(row.value)}%`} off`];
  if (Number(row.minOrderAmount ?? 0) > 0) parts.push(`from ${row.minOrderAmount}`);
  if (row.customerId) parts.push(customerName);
  if (row.weatherCode) parts.push(`weather “${row.weatherCode}”`);
  if (row.bundleMenuItemId) parts.push(`with ${bundleName}`);
  return parts.join(" · ");
}

export default function ConditionalPromotionsPage() {
  const { branchId } = useBranch();
  const customers = useCustomers(branchId);
  const items = useMenuItems(branchId);
  const promotions = usePromotions(branchId);
  const { createPromotion, updatePromotion, promotionActive, deletePromotion } = useMarketingActions(branchId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("PERCENT");
  const [value, setValue] = useState("10");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [weatherCode, setWeatherCode] = useState("");
  const [bundleMenuItemId, setBundleMenuItemId] = useState("");
  const rules = (promotions.data ?? []).filter(
    (row) => Number(row.minOrderAmount ?? 0) > 0 || row.customerId || row.weatherCode || row.bundleMenuItemId,
  );
  const pending = createPromotion.isPending || updatePromotion.isPending;

  const reset = () => {
    setEditingId(null);
    setName("");
    setKind("PERCENT");
    setValue("10");
    setMinOrderAmount("");
    setCustomerId("");
    setWeatherCode("");
    setBundleMenuItemId("");
  };

  const loadEdit = (row: PromotionRow) => {
    setEditingId(row.id);
    setName(row.name);
    setKind(row.kind);
    setValue(String(Number(row.value)));
    setMinOrderAmount(Number(row.minOrderAmount ?? 0) > 0 ? String(row.minOrderAmount) : "");
    setCustomerId(row.customerId ?? "");
    setWeatherCode(row.weatherCode ?? "");
    setBundleMenuItemId(row.bundleMenuItemId ?? "");
  };

  const submit = () => {
    const dto = {
      name: name.trim(),
      kind,
      value: Number(value),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      customerId: customerId || null,
      weatherCode: weatherCode.trim() || null,
      bundleMenuItemId: bundleMenuItemId || null,
      allDay: true,
      daysOfWeek: DAYS,
      startTime: "00:00",
      endTime: "23:59",
    };
    if (editingId) {
      updatePromotion.mutate(
        { id: editingId, dto },
        {
          onSuccess: () => {
            toast.success("Condition updated");
            reset();
          },
          onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update"),
        },
      );
      return;
    }
    createPromotion.mutate(dto, {
      onSuccess: () => {
        toast.success("Condition created");
        reset();
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not save"),
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Conditional discounts</h1>
        <p className="text-sm text-muted-foreground">
          A rule applies only when its spend, customer, weather word, or required dish is met. Weather matches the text from the weather URL in Operations. An empty URL leaves those rules off.
        </p>
      </div>
      <Card className="grid gap-3 p-4">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <select aria-label="Type" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="PERCENT">Percent</option>
            <option value="FLAT">Flat amount</option>
          </select>
          <Input inputMode="decimal" placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
          <Input inputMode="decimal" placeholder="Minimum spend" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} />
          <select aria-label="Customer" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Any customer</option>
            {(customers.data ?? []).map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name || customer.phone || "Customer"}</option>
            ))}
          </select>
          <Input placeholder="Weather word, such as rain" value={weatherCode} onChange={(e) => setWeatherCode(e.target.value)} />
          <select aria-label="Required dish" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={bundleMenuItemId} onChange={(e) => setBundleMenuItemId(e.target.value)}>
            <option value="">No required dish</option>
            {(items.data ?? []).filter((item) => item.isActive).map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            className="justify-self-start"
            disabled={pending || !name.trim() || (!minOrderAmount && !customerId && !weatherCode.trim() && !bundleMenuItemId)}
            onClick={submit}
          >
            {editingId ? "Save" : "Create"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </Card>
      <div className="flex flex-col gap-2">
        {rules.map((row) => {
          const customerName = (customers.data ?? []).find((customer) => customer.id === row.customerId)?.name || "one customer";
          const bundleName = (items.data ?? []).find((item) => item.id === row.bundleMenuItemId)?.name || "a dish";
          return (
            <Card key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className={cn("font-medium", !row.isActive && "line-through text-muted-foreground")}>{row.name}</p>
                <p className="text-sm text-muted-foreground">{summary(row, customerName, bundleName)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" type="button" onClick={() => loadEdit(row)}>
                  Edit
                </Button>
                <Button size="sm" variant="outline" type="button" onClick={() => promotionActive.mutate({ id: row.id, isActive: !row.isActive })}>
                  {row.isActive ? "Pause" : "Resume"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    if (!confirm(`Delete ${row.name}?`)) return;
                    deletePromotion.mutate(row.id, {
                      onSuccess: () => {
                        if (editingId === row.id) reset();
                      },
                    });
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
