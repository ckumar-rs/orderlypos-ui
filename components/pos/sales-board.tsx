"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CreatedOrder, OpenOrder } from "@/hooks/use-orders";
import type { Customer } from "@/hooks/use-customers";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SalesBoard({
  restaurantName,
  bills,
  activeOrder,
  onSelectBill,
  checkout,
  emptyActions,
}: {
  restaurantName: string;
  bills: OpenOrder[];
  activeOrder: CreatedOrder | null;
  onSelectBill: (bill: OpenOrder) => void;
  checkout: ReactNode;
  emptyActions?: ReactNode;
}) {
  const liveBill = bills.find((b) => b.id === activeOrder?.id) ?? null;
  const receiptLines =
    liveBill?.items && liveBill.items.length > 0
      ? liveBill.items.map((item) => ({
          key: item.id,
          label: `${item.quantity} ${item.nameSnapshot}`,
          amount: Number(item.lineTotal),
        }))
      : [];
  const totalsSource = liveBill ?? activeOrder;
  const subtotal = totalsSource ? Number(totalsSource.subtotal) : 0;
  const tax = totalsSource ? Number(totalsSource.taxAmount) : 0;
  const discount = totalsSource ? Number(totalsSource.discountAmount) : 0;
  const tip = totalsSource ? Number(totalsSource.tipAmount) : 0;
  const total = totalsSource ? Number(totalsSource.totalAmount) : 0;
  const createdLabel = liveBill?.createdAt
    ? new Date(liveBill.createdAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[220px_minmax(0,1fr)_340px]">
      <aside className="hidden min-h-0 flex-col border-r border-border bg-secondary/30 lg:flex">
        <div className="border-b border-border px-3 py-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Open bills
          </p>
          <p className="mt-0.5 font-mono text-sm tabular-nums text-foreground">
            {bills.length} unpaid
          </p>
        </div>
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
          {bills.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No open bills. Send from Menu.
            </p>
          ) : (
            bills.map((bill) => {
              const active = activeOrder?.id === bill.id;
              const label = bill.table
                ? bill.table.name ?? `T${bill.table.number}`
                : bill.type.replace(/_/g, " ");
              return (
                <button
                  key={bill.id}
                  type="button"
                  onClick={() => onSelectBill(bill)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-transparent bg-card text-foreground hover:border-border",
                  )}
                >
                  <p className="truncate text-sm font-semibold">
                    {label}
                    <span className={cn("ml-1 font-normal", active ? "opacity-90" : "text-muted-foreground")}>
                      #{bill.orderNumber.slice(-4)}
                    </span>
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 font-mono text-xs tabular-nums",
                      active ? "opacity-90" : "text-muted-foreground",
                    )}
                  >
                    {formatCurrency(Number(bill.totalAmount))}
                    {bill.guestName ? ` · ${bill.guestName}` : ""}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div className="min-h-0 overflow-hidden border-border lg:border-r">
        {activeOrder ? (
          <div className="h-full min-h-0 overflow-y-auto p-3 sm:p-4">{checkout}</div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              Pick an open bill to settle. Receipt updates on the right as you pay.
            </p>
            {emptyActions}
            <ul className="mt-2 w-full max-w-md space-y-2 lg:hidden">
              {bills.map((bill) => (
                <li key={bill.id}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-between px-3 py-2"
                    onClick={() => onSelectBill(bill)}
                  >
                    <span>
                      #{bill.orderNumber}
                      {bill.table
                        ? ` · ${bill.table.name ?? `T${bill.table.number}`}`
                        : ""}
                    </span>
                    <span className="font-mono">
                      {formatCurrency(Number(bill.totalAmount))}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <aside className="hidden min-h-0 overflow-y-auto bg-secondary/40 p-5 lg:block">
        <div className="mx-auto max-w-[17rem] rounded-sm border border-border bg-card px-5 py-6 text-foreground shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
          <p className="text-center text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
            {restaurantName}
          </p>
          <p className="mt-2 text-center font-mono text-xs font-semibold">
            {activeOrder ? `ORDER #${activeOrder.orderNumber}` : "RECEIPT"}
          </p>
          {liveBill?.table || liveBill?.guestName ? (
            <p className="mt-1 text-center text-[11px] text-muted-foreground">
              {liveBill.table
                ? liveBill.table.name ?? `Table ${liveBill.table.number}`
                : null}
              {liveBill.guestName
                ? `${liveBill.table ? " · " : ""}${liveBill.guestName}`
                : null}
            </p>
          ) : null}
          {createdLabel ? (
            <p className="mt-1 text-center font-mono text-[10px] text-muted-foreground">
              {createdLabel}
            </p>
          ) : null}
          <div className="my-4 border-t border-dashed border-border" />
          {receiptLines.length === 0 ? (
            <p className="py-6 text-center font-mono text-xs text-muted-foreground">
              {activeOrder ? "Lines load with the bill" : "Select a bill"}
            </p>
          ) : (
            <ul className="space-y-2 font-mono text-[11px]">
              {receiptLines.map((line) => (
                <li key={line.key} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">{line.label}</span>
                  <span className="shrink-0 tabular-nums">{formatCurrency(line.amount)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="my-4 border-t border-dashed border-border" />
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            {tax > 0 ? (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">{formatCurrency(tax)}</span>
              </div>
            ) : null}
            {discount > 0 ? (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums">−{formatCurrency(discount)}</span>
              </div>
            ) : null}
            {tip > 0 ? (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Tip</span>
                <span className="tabular-nums">{formatCurrency(tip)}</span>
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 font-mono text-sm font-semibold">
            <span>TOTAL</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
          <p className="mt-6 text-center text-[10px] tracking-wide text-muted-foreground">
            Thank you — pay on the left
          </p>
        </div>
      </aside>
    </div>
  );
}

export type { Customer };
