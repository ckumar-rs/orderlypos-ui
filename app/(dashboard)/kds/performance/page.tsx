"use client";

import { useState } from "react";
import { KdsNav } from "@/components/kds/kds-nav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QueryError } from "@/components/ui/query-error";
import { useBranch } from "@/hooks/use-branch";
import { useKitchenPerformance } from "@/hooks/use-kds";

function percent(value: number | null) {
  return value == null ? "—" : `${value}%`;
}

function minutes(value: number | null) {
  return value == null ? "—" : `${value}m`;
}

export default function StationReportPage() {
  const { branchId } = useBranch();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const report = useKitchenPerformance(branchId, date);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Station report</h1>
        <p className="text-sm text-muted-foreground">
          Prep time, delays, tickets per hour, and how many met the dish prep target. The target is 15 minutes when a dish has none.
        </p>
      </div>
      <KdsNav />
      <Input className="max-w-xs" type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Date" />
      {report.isError ? (
        <QueryError error={report.error} what="the station report" onRetry={() => void report.refetch()} retrying={report.isFetching} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(report.data ?? []).map((row) => (
            <Card key={row.stationId} className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-foreground">{row.stationName}</p>
                <p className="text-xs text-muted-foreground">{row.ticketsReady} ready</p>
              </div>
              <Metric label="Average prep" value={minutes(row.avgMinutesToReady)} />
              <Metric label="Delay rate" value={percent(row.delayRate)} />
              <Metric label="Throughput" value={`${row.throughputPerHour}/h`} />
              <Metric label="On time" value={percent(row.slaCompliance)} />
            </Card>
          ))}
          {report.data && report.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No stations on this branch.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
