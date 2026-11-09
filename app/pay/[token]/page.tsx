"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { buildUpiUri } from "@/lib/upi";

interface PayBill {
  orderNumber: string;
  status: string;
  currency: string;
  totalAmount: number;
  tipAmount: number;
  amountPaid: number;
  due: number;
  cashLabel: string;
  preferredPaymentMethod: string | null;
  paidClaimEnabled: boolean;
  upi: { vpa: string; payeeName: string } | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    lineTotal: number;
  }>;
}

export default function GuestPayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const bill = useQuery({
    queryKey: ["public-pay", token],
    queryFn: () => api.get<PayBill>(`/public/pay/${token}`),
    refetchInterval: (query) =>
      query.state.data?.status === "PAID" ? false : 3000,
    retry: false,
  });

  const data = bill.data;
  const paid = data?.status === "PAID";
  const due = data?.due ?? 0;
  const code = data?.currency || "INR";
  const cashLabel = data?.cashLabel || "Cash";
  const upiUri =
    data?.upi && due > 0 && !paid
      ? buildUpiUri({
          vpa: data.upi.vpa,
          name: data.upi.payeeName,
          amount: due,
          note: `Order ${data.orderNumber}`,
          ref: data.orderNumber,
        })
      : "";

  useEffect(() => {
    if (paid) setMessage("Paid — thank you");
  }, [paid]);

  if (bill.isLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6 text-sm text-muted-foreground">
        Loading bill…
      </main>
    );
  }

  if (bill.isError || !data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-2 p-6">
        <h1 className="text-xl font-semibold">Bill unavailable</h1>
        <p className="text-sm text-muted-foreground">
          {bill.error instanceof ApiError
            ? bill.error.message
            : "This pay link is missing or has expired. Ask staff for a new one."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 bg-background p-5 text-foreground">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Your bill
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Order #{data.orderNumber}
        </h1>
      </div>

      <ul className="divide-y divide-border border-y border-border">
        {data.items.map((item) => (
          <li
            key={item.id}
            className="flex items-baseline justify-between gap-3 py-3 text-sm"
          >
            <span>
              <span className="mr-2 text-muted-foreground">{item.quantity}×</span>
              {item.name}
            </span>
            <span className="tabular-nums">
              {formatCurrency(item.lineTotal, code)}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="tabular-nums">
            {formatCurrency(data.totalAmount, code)}
          </span>
        </div>
        {data.amountPaid > 0 ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Already paid</span>
            <span className="tabular-nums">
              {formatCurrency(data.amountPaid, code)}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between text-lg font-semibold">
          <span>{paid ? "Paid" : "Due"}</span>
          <span className="tabular-nums">{formatCurrency(due, code)}</span>
        </div>
      </div>

      {upiUri ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-black shadow-sm">
          <QRCodeSVG value={upiUri} size={220} level="M" marginSize={1} />
          <p className="text-center text-sm">
            Scan to pay {formatCurrency(due, code)}
            {data.upi?.payeeName ? ` to ${data.upi.payeeName}` : ""}
          </p>
          <Button type="button" className="w-full" render={<a href={upiUri} />}>
            Open UPI app
          </Button>
        </div>
      ) : !paid ? (
        <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          UPI is not configured for this restaurant. Pay {cashLabel} at the
          counter, or ask staff for help.
        </p>
      ) : null}

      {!paid && data.paidClaimEnabled ? (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            api
              .post(`/public/pay/${token}/claim-paid`)
              .then(() => {
                setMessage(
                  "Told the counter you paid — they will confirm on the till",
                );
                void qc.invalidateQueries({ queryKey: ["public-pay", token] });
              })
              .catch((error) =>
                setMessage(
                  error instanceof ApiError
                    ? error.message
                    : "Could not send",
                ),
              )
          }
        >
          I paid
        </Button>
      ) : null}

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      {!paid ? (
        <p className="text-xs text-muted-foreground">
          Paying with UPI does not mark the bill paid by itself. Staff confirm
          on the till
          {data.paidClaimEnabled
            ? ', or tap "I paid" after you finish in your UPI app.'
            : "."}
        </p>
      ) : null}
    </main>
  );
}
