"use client";

import { useState } from "react";
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
  demoMode: boolean;
  gatewayAvailable: boolean;
  upi: { vpa: string; payeeName: string } | null;
  items: Array<{ id: string; name: string; quantity: number; guestNumber: number | null; lineTotal: number }>;
}

export function GuestSettle({ token, orderNumber, currency }: { token: string; orderNumber: string; currency: string }) {
  const qc = useQueryClient();
  const quote = useQuery({
    queryKey: ["guest-bill", token, orderNumber],
    queryFn: () => api.get<Quote>(`/public/menu/${token}/orders/${orderNumber}`),
  });
  const [tip, setTip] = useState("");
  const [message, setMessage] = useState("");
  const bill = quote.data;
  const due = bill?.due ?? 0;
  const code = bill?.currency || currency;
  const upiUri = bill?.upi && due > 0
    ? buildUpiUri({
        vpa: bill.upi.vpa,
        name: bill.upi.payeeName,
        amount: due,
        note: `Order ${orderNumber}`,
        ref: orderNumber,
      })
    : "";
  const refresh = () => qc.invalidateQueries({ queryKey: ["guest-bill", token, orderNumber] });
  return (
    <section className="mx-auto flex max-w-md flex-col gap-3 p-4">
      <h2 className="text-lg font-semibold">Your bill #{orderNumber}</h2>
      {(bill?.items ?? []).map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
          <span>{item.quantity} × {item.name}</span>
          <span>{formatCurrency(item.lineTotal, code)}</span>
          <select
            className="h-8 rounded-md border border-input bg-background px-1"
            value={item.guestNumber ?? 1}
            aria-label={`Guest for ${item.name}`}
            disabled={bill?.status === "PAID"}
            onChange={(event) => {
              api.post(`/public/menu/${token}/orders/${orderNumber}/split`, { itemId: item.id, guestNumber: Number(event.target.value) }).then(refresh);
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((guest) => <option key={guest} value={guest}>Guest {guest}</option>)}
          </select>
        </div>
      ))}
      <p>Food {formatCurrency(bill?.totalAmount ?? 0, code)}</p>
      <p>Tip {formatCurrency(bill?.tipAmount ?? 0, code)}</p>
      <p className="text-xl font-semibold">{bill?.status === "PAID" ? "Paid" : "Due"} {formatCurrency(due, code)}</p>
      {bill?.status !== "PAID" ? (
        <div className="flex gap-2">
          <Input value={tip} onChange={(e) => setTip(e.target.value)} placeholder="Tip amount" inputMode="decimal" />
          <Button type="button" variant="outline" onClick={() => api.post(`/public/menu/${token}/orders/${orderNumber}/tip`, { tipAmount: Number(tip) || 0 }).then(refresh)}>Save tip</Button>
        </div>
      ) : null}
      {upiUri ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-black">
          <QRCodeSVG value={upiUri} size={180} level="M" marginSize={1} />
          <p className="text-sm">Scan to pay {formatCurrency(due, code)} to {bill?.upi?.payeeName}</p>
        </div>
      ) : null}
      {bill?.status !== "PAID" && (bill?.demoMode || bill?.gatewayAvailable) ? (
        <Button
          type="button"
          onClick={() =>
            api.post<{ paid: boolean; checkoutUrl?: string | null }>(`/public/menu/${token}/orders/${orderNumber}/pay`, {})
              .then((row) => {
                if (row.checkoutUrl) window.location.assign(row.checkoutUrl);
                else setMessage(row.paid ? "Paid" : "Payment started");
                refresh();
              })
              .catch((error) => setMessage(error instanceof ApiError ? error.message : "Could not pay"))
          }
        >
          {bill.demoMode ? "Pay now" : "Pay online"}
        </Button>
      ) : null}
      {message ? <p className="text-sm">{message}</p> : null}
      {!bill?.demoMode && !bill?.gatewayAvailable && bill?.status !== "PAID" ? (
        <p className="text-sm text-muted-foreground">The UPI code pays this bill, including the tip. The counter confirms it unless a gateway is stored in Settings.</p>
      ) : null}
    </section>
  );
}
