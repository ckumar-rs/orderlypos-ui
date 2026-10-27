"use client";

import { useState } from "react";
import { toast } from "sonner";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  useApplyForecastReorders,
  useForecast,
  useForecasts,
  useGenerateForecast,
} from "@/hooks/use-inventory";
import { ApiError } from "@/lib/api";

export default function ForecastPage() {
  const { branchId } = useBranch();
  const { data: list, isLoading } = useForecasts(branchId);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: detail } = useForecast(branchId, openId);
  const generate = useGenerateForecast(branchId);
  const apply = useApplyForecastReorders(branchId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Paid-sales velocity, then a Hugging Face or NVIDIA model if you stored one in Settings
          </p>
        </div>
        <Button
          size="sm"
          disabled={generate.isPending}
          onClick={() =>
            generate.mutate(undefined, {
              onSuccess: (row) => {
                setOpenId(row.id);
                toast.success(
                  row.source === "LOCAL"
                    ? `${row.forecastNumber} from weekday velocity`
                    : `${row.forecastNumber} from ${row.source}`,
                );
              },
              onError: (err) =>
                toast.error(err instanceof ApiError ? err.message : "Could not generate forecast"),
            })
          }
        >
          {generate.isPending ? "Generating…" : "Generate forecast"}
        </Button>
      </div>

      <InventoryTabs />

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : list && list.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Forecast</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Horizon</TableHead>
                <TableHead>By</TableHead>
                <TableHead>When</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.forecastNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.source}</Badge>
                    {row.weatherUsed ? (
                      <span className="ml-2 text-xs text-muted-foreground">weather</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="tabular-nums">{row.horizonDays}d</TableCell>
                  <TableCell className="text-muted-foreground">{row.generatedBy.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(row.generatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setOpenId(row.id)}>
                      Lines
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No forecasts yet</p>
            <p className="text-sm text-muted-foreground">
              Configure a model in Settings → Demand forecast, or generate a local weekday
              projection from paid bills.
            </p>
          </div>
        )}
      </Card>

      {detail?.lines && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                {detail.forecastNumber} · {detail.source}
                {detail.model ? ` · ${detail.model}` : ""}
              </p>
              {detail.modelError && (
                <p className="text-xs text-destructive">{detail.modelError}</p>
              )}
            </div>
            <Button
              size="sm"
              disabled={apply.isPending}
              onClick={() =>
                apply.mutate(detail.id, {
                  onSuccess: () => toast.success("Purchase request opened from this forecast"),
                  onError: (err) =>
                    toast.error(err instanceof ApiError ? err.message : "Could not apply"),
                })
              }
            >
              Apply suggested reorders
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kind</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">History</TableHead>
                <TableHead className="text-right">Velocity / day</TableHead>
                <TableHead className="text-right">Local</TableHead>
                <TableHead className="text-right">Model</TableHead>
                <TableHead className="text-right">Forecast</TableHead>
                <TableHead className="text-right">Reorder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="text-muted-foreground">{line.kind}</TableCell>
                  <TableCell className="font-medium">
                    {line.name}
                    {line.unit ? (
                      <span className="ml-1 text-xs text-muted-foreground">{line.unit}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{line.historyQty}</TableCell>
                  <TableCell className="text-right tabular-nums">{line.dailyVelocity}</TableCell>
                  <TableCell className="text-right tabular-nums">{line.localForecastQty}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.modelForecastQty ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{line.forecastQty}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.suggestedReorderQty ?? "—"}
                    {line.leadTimeDays != null ? (
                      <div className="text-xs text-muted-foreground">lead {line.leadTimeDays}d</div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
