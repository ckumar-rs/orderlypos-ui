"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { buildUpiUri } from "@/lib/upi";

interface Quote {
  orderNumber: string;
  status: string;
  totalAmount: number;
  tipAmount: number;
  due: number;
  currency: string;
  gatewayAvailable: boolean;
  checkoutUrl?: string | null;
  intentStatus?: string | null;
  upi: { vpa: string; payeeName: string } | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    guestNumber: number | null;
    lineTotal: number;
  }>;
}

export function GuestSettle({
  token,
  orderNumber,
  currency,
  guestSignals,
  cashLabel = "Cash",
  preferredPaymentMethod,
}: {
  token: string;
  orderNumber: string;
  currency: string;
  guestSignals?: { paidClaim?: boolean; cod?: boolean };
  /** From restaurant_settings.cash_label */
  cashLabel?: string;
  preferredPaymentMethod?: string | null;
}) {
  const qc = useQueryClient();
  const quote = useQuery({
    queryKey: ["guest-bill", token, orderNumber],
    queryFn: () => api.get<Quote>(`/public/menu/${token}/orders/${orderNumber}`),
    refetchInterval: (query) => (query.state.data?.status === "PAID" ? false : 3000),
  });
  const [tip, setTip] = useState("");
  const [message, setMessage] = useState("");
  const [paying, setPaying] = useState(false);
  const bill = quote.data;
  const due = bill?.due ?? 0;
  const code = bill?.currency || currency;
  const paid = bill?.status === "PAID";
  const upiUri =
    bill?.upi && due > 0 && !paid
      ? buildUpiUri({
          vpa: bill.upi.vpa,
          name: bill.upi.payeeName,
          amount: due,
          note: `Order ${orderNumber}`,
          ref: orderNumber,
        })
      : "";
  const refresh = () => qc.invalidateQueries({ queryKey: ["guest-bill", token, orderNumber] });
  const preferred = (preferredPaymentMethod || "").toUpperCase();

  useEffect(() => {
    if (paid) setMessage("Paid — thank you");
  }, [paid]);

  const pay = async () => {
    setPaying(true);
    setMessage("");
    try {
      const row = await api.post<{ paid: boolean; checkoutUrl?: string | null }>(
        `/public/menu/${token}/orders/${orderNumber}/pay`,
        {},
      );
      if (row.checkoutUrl) {
        window.location.assign(row.checkoutUrl);
        return;
      }
      setMessage(
        row.paid
          ? "Paid — thank you"
          : upiUri
            ? `Scan the UPI code, or choose ${cashLabel} at the counter`
            : preferred
              ? `Pay with ${preferred === "CASH" ? cashLabel : preferred}, or ask staff for help`
              : `Pay ${cashLabel} at the counter, or ask staff for help`,
      );
      refresh();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Could not pay");
    } finally {
      setPaying(false);
    }
  };

  return (
    <section className="mx-auto flex max-w-md flex-col gap-3 p-4">
      <h2 className="text-lg font-semibold">Your bill #{orderNumber}</h2>
      {(bill?.items ?? []).map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
          <span>
            {item.quantity} × {item.name}
          </span>
          <span>{formatCurrency(item.lineTotal, code)}</span>
          <select
            className="h-8 rounded-md border border-input bg-background px-1"
            value={item.guestNumber ?? 1}
            aria-label={`Guest for ${item.name}`}
            disabled={paid}
            onChange={(event) => {
              api
                .post(`/public/menu/${token}/orders/${orderNumber}/split`, {
                  itemId: item.id,
                  guestNumber: Number(event.target.value),
                })
                .then(refresh);
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((guest) => (
              <option key={guest} value={guest}>
                Guest {guest}
              </option>
            ))}
          </select>
        </div>
      ))}
      <p>Food {formatCurrency(bill?.totalAmount ?? 0, code)}</p>
      <p>Tip {formatCurrency(bill?.tipAmount ?? 0, code)}</p>
      <p className="text-xl font-semibold">
        {paid ? "Paid" : "Due"} {formatCurrency(due, code)}
      </p>
      {!paid ? (
        <div className="flex gap-2">
          <Input
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            placeholder="Tip amount"
            inputMode="decimal"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              api
                .post(`/public/menu/${token}/orders/${orderNumber}/tip`, {
                  tipAmount: Number(tip) || 0,
                })
                .then(refresh)
            }
          >
            Save tip
          </Button>
        </div>
      ) : null}
      {upiUri ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-black">
          <QRCodeSVG value={upiUri} size={180} level="M" marginSize={1} />
          <p className="text-sm">
            Scan to pay {formatCurrency(due, code)} to {bill?.upi?.payeeName}
          </p>
        </div>
      ) : null}
      {!paid && (bill?.gatewayAvailable || bill?.checkoutUrl) ? (
        <Button type="button" disabled={paying} onClick={() => void pay()}>
          {bill.checkoutUrl ? "Continue online payment" : "Pay online"}
        </Button>
      ) : null}
      {!paid && (guestSignals?.paidClaim || guestSignals?.cod) ? (
        <div className="flex flex-wrap gap-2">
          {guestSignals.paidClaim ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                api
                  .post(`/public/menu/${token}/request`, { type: "PAID_CLAIM" })
                  .then(() => setMessage("Told the counter you paid — they will confirm on the till"))
                  .catch((error) =>
                    setMessage(error instanceof ApiError ? error.message : "Could not send"),
                  )
              }
            >
              I paid
            </Button>
          ) : null}
          {guestSignals.cod ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                api
                  .post(`/public/menu/${token}/request`, { type: "COD" })
                  .then(() =>
                    setMessage(`Asked for ${cashLabel} — staff will collect at the counter`),
                  )
                  .catch((error) =>
                    setMessage(error instanceof ApiError ? error.message : "Could not send"),
                  )
              }
            >
              Want {cashLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
      {message ? <p className="text-sm">{message}</p> : null}
      {!paid && !bill?.gatewayAvailable ? (
        <p className="text-sm text-muted-foreground">
          {upiUri
            ? `Scan the code to pay, including tip. ${cashLabel} is available at the counter when staff have turned it on.`
            : preferred
              ? `Preferred method is ${preferred === "CASH" ? cashLabel : preferred}. Ask staff if you need another option.`
              : `Pay at the counter. Staff set payment options in Settings.`}{" "}
          When a payment gateway is stored in Settings, this page marks the bill paid automatically
          after the bank confirms.
        </p>
      ) : null}
      {!paid && bill?.gatewayAvailable ? (
        <p className="text-sm text-muted-foreground">
          After you pay online, this bill marks itself paid when the gateway confirms.
        </p>
      ) : null}
    </section>
  );
}
