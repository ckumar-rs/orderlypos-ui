"use client";

import { BellRing, Receipt } from "lucide-react";
import { GuestSettle } from "@/components/table-qr/guest-settle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ITEM_STATUS_LABEL, type PublicStatus } from "@/components/order/guest-types";

const PIPELINE = ["NEW", "ACCEPTED", "PREPARING", "READY", "SERVED"] as const;

function stepIndex(status: string) {
  const normalized = status === "ACCEPTED" ? "NEW" : status;
  const idx = PIPELINE.indexOf(normalized as (typeof PIPELINE)[number]);
  return idx < 0 ? 0 : idx;
}

export function GuestOrderStatus({
  status,
  currency,
  token,
  guestSignals,
  cashLabel,
  preferredPaymentMethod,
  requesting,
  onRequest,
}: {
  status: PublicStatus;
  currency: string;
  token: string;
  guestSignals?: { paidClaim?: boolean; cod?: boolean; waiter?: boolean; bill?: boolean };
  cashLabel?: string;
  preferredPaymentMethod?: string | null;
  requesting: boolean;
  onRequest: (type: "WAITER" | "BILL") => void;
}) {
  const order = status.order;
  if (!order && status.openRequests.length === 0) return null;

  const farthest = order
    ? Math.max(0, ...order.items.map((item) => stepIndex(item.status)))
    : 0;

  return (
    <section className="mx-auto max-w-lg px-4 pb-4">
      {order ? (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="border-b border-border bg-secondary/40 px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Your order
                </p>
                <p className="mt-0.5 text-base font-semibold tabular-nums">#{order.orderNumber}</p>
              </div>
              {order.acceptance === "PENDING" ? (
                <span className="rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-medium text-warning">
                  Awaiting confirm
                </span>
              ) : (
                <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success">
                  In the kitchen
                </span>
              )}
            </div>
            <ol className="mt-4 flex gap-1" aria-label="Order progress">
              {PIPELINE.slice(0, 4).map((step, index) => (
                <li
                  key={step}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    index <= farthest ? "bg-primary" : "bg-border",
                  )}
                />
              ))}
            </ol>
          </div>
          <ul className="divide-y divide-border px-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="min-w-0 truncate text-foreground">
                  <span className="font-medium tabular-nums">{item.quantity}×</span> {item.nameSnapshot}
                </span>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {ITEM_STATUS_LABEL[item.status] ?? item.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        {guestSignals?.waiter !== false ? (
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl"
            disabled={requesting || status.openRequests.includes("WAITER")}
            onClick={() => onRequest("WAITER")}
          >
            <BellRing className="mr-2 size-4" />
            {status.openRequests.includes("WAITER") ? "On the way" : "Call waiter"}
          </Button>
        ) : (
          <span />
        )}
        {order && guestSignals?.bill !== false ? (
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl"
            disabled={requesting || status.openRequests.includes("BILL")}
            onClick={() => onRequest("BILL")}
          >
            <Receipt className="mr-2 size-4" />
            {status.openRequests.includes("BILL") ? "Bill asked" : "Request bill"}
          </Button>
        ) : null}
      </div>

      {order && order.status !== "PAID" && order.status !== "CANCELLED" ? (
        <div className="mt-3 overflow-hidden rounded-3xl border border-border">
          <GuestSettle
            token={token}
            orderNumber={order.orderNumber}
            currency={currency}
            guestSignals={guestSignals}
            cashLabel={cashLabel}
            preferredPaymentMethod={preferredPaymentMethod}
          />
        </div>
      ) : null}
    </section>
  );
}
