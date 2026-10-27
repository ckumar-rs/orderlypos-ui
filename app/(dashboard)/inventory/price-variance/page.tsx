"use client";

import { useMemo, useState } from "react";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { usePriceVariance } from "@/hooks/use-inventory";
import { formatCurrency } from "@/lib/format";

function defaultRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

export default function PriceVariancePage() {
  const { branchId } = useBranch();
  const initial = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const { data, isLoading } = usePriceVariance(branchId, from, to);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Purchase price variance: GRN actual vs PO and vs the latest quote for that supplier
        </p>
      </div>

      <InventoryTabs />

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="ppv-from">From</Label>
          <Input id="ppv-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="ppv-to">To</Label>
          <Input id="ppv-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3 text-sm font-medium">
          By ingredient and supplier
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : data && data.summary.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Avg</TableHead>
                <TableHead className="text-right">Min / max</TableHead>
                <TableHead className="text-right">vs PO</TableHead>
                <TableHead className="text-right">vs quote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.summary.map((row) => (
                <TableRow key={`${row.ingredientId}:${row.supplierId}`}>
                  <TableCell className="font-medium">{row.ingredientName}</TableCell>
                  <TableCell>{row.supplierName}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.qty}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(row.avg)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(row.min)} / {formatCurrency(row.max)}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${row.varianceVsPo > 0 ? "text-destructive" : ""}`}
                  >
                    {formatCurrency(row.varianceVsPo)}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${row.varianceVsQuote > 0 ? "text-destructive" : ""}`}
                  >
                    {formatCurrency(row.varianceVsQuote)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-4 py-10 text-sm text-muted-foreground">
            No goods receipts in this range.
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3 text-sm font-medium">Each receipt line</div>
        {data && data.lines.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GRN</TableHead>
                <TableHead>Ingredient</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">PO</TableHead>
                <TableHead className="text-right">Quote</TableHead>
                <TableHead className="text-right">PPV vs PO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.lines.map((line) => (
                <TableRow key={line.goodsReceiptItemId}>
                  <TableCell>
                    {line.grnNumber}
                    <div className="text-xs text-muted-foreground">
                      {new Date(line.receivedAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{line.ingredientName}</TableCell>
                  <TableCell>{line.supplierName}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.qty} {line.unit}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(line.actual)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.po == null ? "—" : formatCurrency(line.po)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.quoted == null ? "—" : formatCurrency(line.quoted)}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${(line.varianceVsPo ?? 0) > 0 ? "text-destructive" : ""}`}
                  >
                    {line.varianceVsPo == null ? "—" : formatCurrency(line.varianceVsPo)}
                    {line.pctVsPo != null ? ` (${line.pctVsPo}%)` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-4 py-10 text-sm text-muted-foreground">No receipt lines.</div>
        )}
      </Card>
    </div>
  );
}
