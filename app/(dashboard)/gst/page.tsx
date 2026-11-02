"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGstBilling } from "@/hooks/use-accounting";
import { useBranch } from "@/hooks/use-branch";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = ["invoices", "return", "required"] as const;
type Tab = (typeof TABS)[number];

function monthRange() {
  const now = new Date();
  return {
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

const KIND: Record<string, string> = {
  TAX_INVOICE: "Tax invoice",
  BILL_OF_SUPPLY: "Bill of supply",
};

export default function GstBillingPage() {
  const { branchId } = useBranch();
  const [tab, setTab] = useState<Tab>("invoices");
  const [range, setRange] = useState(monthRange);
  const { data, isLoading } = useGstBilling(branchId, range.from, range.to);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">GST billing</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Paid orders in this branch are the tax invoices. Prices already include GST. A guest in another state is IGST.
          The same state is CGST and SGST. Refunds are listed as credit notes. This page does not file a return on the GST portal.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "rounded-full border px-3.5 py-1 text-xs capitalize transition-colors",
              tab === item ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            {item}
          </button>
        ))}
        <Input type="date" className="w-40" value={range.from} onChange={(event) => setRange({ ...range, from: event.target.value })} />
        <Input type="date" className="w-40" value={range.to} onChange={(event) => setRange({ ...range, to: event.target.value })} />
      </div>
      {isLoading || !data ? (
        <Skeleton className="h-40" />
      ) : tab === "invoices" ? (
        <Card className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-1">Order</th>
                <th>Guest</th>
                <th>Kind</th>
                <th>Supply</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.documents.map((doc) => (
                <tr key={doc.orderNumber} className="border-t border-border">
                  <td className="py-1.5">{doc.orderNumber}</td>
                  <td>{doc.guestName || "Walk-in"}</td>
                  <td>{KIND[doc.kind]}</td>
                  <td>{doc.supply === "INTER" ? "IGST" : doc.utgst > 0 ? "CGST + UTGST" : "CGST + SGST"}</td>
                  <td className="text-right">{formatCurrency(doc.total)}</td>
                </tr>
              ))}
              {data.documents.length === 0 && (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={5}>No paid orders in this range.</td>
                </tr>
              )}
            </tbody>
          </table>
          {data.creditNotes.length > 0 && (
            <div className="mt-4">
              <h2 className="text-sm font-semibold">Credit notes</h2>
              {data.creditNotes.map((note) => (
                <p key={`${note.orderNumber}-${note.createdAt}`} className="py-1 text-sm text-muted-foreground">
                  Order {note.orderNumber} · refund {formatCurrency(note.amount)} · CGST {formatCurrency(note.cgst)} · SGST {formatCurrency(note.sgst)} · UTGST {formatCurrency(note.utgst)} · IGST {formatCurrency(note.igst)}
                </p>
              ))}
            </div>
          )}
        </Card>
      ) : tab === "return" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Tax collected</h2>
            <p className="py-1 text-sm">CGST {formatCurrency(data.cgst)}</p>
            <p className="py-1 text-sm">SGST {formatCurrency(data.sgst)}</p>
            <p className="py-1 text-sm">UTGST {formatCurrency(data.utgst)}</p>
            <p className="py-1 text-sm">IGST {formatCurrency(data.igst)}</p>
            <p className="py-1 text-sm text-muted-foreground">Taxable {formatCurrency(data.rates.totalTaxable)}</p>
          </Card>
          <Card className="overflow-x-auto p-4">
            <h2 className="text-sm font-semibold">HSN</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="py-1">Code</th><th>Taxable</th><th className="text-right">Tax</th></tr>
              </thead>
              <tbody>
                {data.hsn.map((row) => (
                  <tr key={row.code} className="border-t border-border">
                    <td className="py-1.5">{row.code}</td>
                    <td>{formatCurrency(row.taxable)}</td>
                    <td className="text-right">{formatCurrency(row.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        <Card className="flex flex-col gap-3 p-4">
          {data.requirements.map((item) => (
            <div key={item.id}>
              <p className="text-sm font-semibold">{item.done ? "Ready" : "Needed"} · {item.label}</p>
              <p className="text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
          <p className="text-sm text-muted-foreground">
            Document names follow tax invoice, bill of supply, and credit note. GSTR-1 JSON, GSTR-2B matching, e-way bills, and TDS sections stay with your accountant.
            The rate summary on <Link className="underline" href="/accounting">Accounting</Link> is the same paid-order tax.
          </p>
        </Card>
      )}
    </div>
  );
}
