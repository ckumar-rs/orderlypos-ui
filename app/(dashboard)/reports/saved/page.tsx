"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface Saved {
  id: string;
  name: string;
  reportKey: string;
  days: number;
}

interface RunResult {
  saved: Saved;
  result: { columns: string[]; rows: unknown[][] };
}

const KEYS = ["sales-daily", "sales-by-item", "payment-methods", "customers", "reservations"];

export default function SavedReportsPage() {
  const { branchId } = useBranch();
  const queryClient = useQueryClient();
  const reports = useQuery({
    queryKey: ["saved-reports", branchId],
    queryFn: () => api.get<Saved[]>(`/platform/saved-reports?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const [name, setName] = useState("");
  const [reportKey, setReportKey] = useState(KEYS[0]);
  const [days, setDays] = useState(7);
  const [run, setRun] = useState<RunResult | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <Link href="/reports" className="text-sm underline">Reports</Link>
      <h1 className="text-2xl font-semibold">Saved reports</h1>
      <Card className="flex flex-wrap items-end gap-2 p-4">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
        <select className="h-10 rounded-md border border-input bg-background px-2" value={reportKey} onChange={(event) => setReportKey(event.target.value)}>
          {KEYS.map((key) => <option key={key} value={key}>{key}</option>)}
        </select>
        <Input className="w-24" type="number" value={days} onChange={(event) => setDays(Number(event.target.value))} />
        <Button
          type="button"
          onClick={() =>
            api
              .post(`/platform/saved-reports?branchId=${branchId}`, { name, reportKey, days })
              .then(() => {
                setName("");
                void queryClient.invalidateQueries({ queryKey: ["saved-reports", branchId] });
              })
              .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"))
          }
        >
          Save
        </Button>
      </Card>
      <div className="grid gap-3">
        {(reports.data ?? []).map((report) => (
          <Card key={report.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{report.name}</p>
              <p className="text-sm text-muted-foreground">{report.reportKey} · last {report.days} days</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                api
                  .post<RunResult>(`/platform/saved-reports/${report.id}/run?branchId=${branchId}`)
                  .then(setRun)
                  .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not run"))
              }
            >
              Run
            </Button>
          </Card>
        ))}
      </div>
      {run ? (
        <Card className="overflow-auto p-4">
          <p className="mb-2 font-medium">{run.saved.name}</p>
          <table className="w-full text-sm">
            <thead>
              <tr>{run.result.columns.map((column) => <th key={column} className="p-1 text-left">{column}</th>)}</tr>
            </thead>
            <tbody>
              {run.result.rows.slice(0, 30).map((row, index) => (
                <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="p-1">{String(cell ?? "")}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </div>
  );
}
