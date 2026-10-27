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
import { useYieldReport } from "@/hooks/use-inventory";
import { formatCurrency } from "@/lib/format";

function defaultRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

export default function YieldPage() {
  const { branchId } = useBranch();
  const initial = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const { data, isLoading } = useYieldReport(branchId, from, to);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Theoretical usage (recipe on paid bills) vs actual (opening + receipts − closing)
        </p>
      </div>

      <InventoryTabs />

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="yield-from">From</Label>
          <Input id="yield-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="yield-to">To</Label>
          <Input id="yield-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {data && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Theoretical" value={data.totals.theoretical.toFixed(3)} />
          <Stat label="Actual usage" value={data.totals.actualUsage.toFixed(3)} />
          <Stat label="Waste cost" value={formatCurrency(data.totals.wasteCost)} />
          <Stat
            label="Unexplained"
            value={formatCurrency(data.totals.unexplainedCost)}
          />
        </div>
      )}

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : data && data.rows.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead className="text-right">Open</TableHead>
                <TableHead className="text-right">In</TableHead>
                <TableHead className="text-right">Close</TableHead>
                <TableHead className="text-right">Theoretical</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Waste %</TableHead>
                <TableHead className="text-right">Yield %</TableHead>
                <TableHead className="text-right">Unexplained</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.ingredientId}>
                  <TableCell className="font-medium">
                    {row.name}{" "}
                    <span className="text-xs text-muted-foreground">{row.unit}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.opening}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.receipts}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.closing}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.theoretical}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.actualUsage}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.wastePct}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.yieldPct}</TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${row.unexplained > 0 ? "text-destructive" : ""}`}
                  >
                    {row.unexplained} ({formatCurrency(row.unexplainedCost)})
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No movement in this range</p>
            <p className="text-sm text-muted-foreground">
              Sell tracked items, log waste, or post a physical count to see yield loss.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </Card>
  );
}
