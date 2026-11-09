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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [reportKey, setReportKey] = useState(KEYS[0]);
  const [days, setDays] = useState(7);
  const [run, setRun] = useState<RunResult | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["saved-reports", branchId] });
  const reset = () => {
    setEditingId(null);
    setName("");
    setReportKey(KEYS[0]);
    setDays(7);
  };
  const loadEdit = (report: Saved) => {
    setEditingId(report.id);
    setName(report.name);
    setReportKey(report.reportKey);
    setDays(report.days);
  };
  const submit = () => {
    const body = { name, reportKey, days };
    const req = editingId
      ? api.put(`/platform/saved-reports/${editingId}?branchId=${branchId}`, body)
      : api.post(`/platform/saved-reports?branchId=${branchId}`, body);
    req
      .then(() => {
        toast.success(editingId ? "Report updated" : "Report created");
        reset();
        refresh();
      })
      .catch((error) =>
        toast.error(error instanceof ApiError ? error.message : editingId ? "Could not update" : "Could not save"),
      );
  };
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
        <Button type="button" disabled={!name.trim()} onClick={submit}>
          {editingId ? "Save" : "Create"}
        </Button>
        {editingId && (
          <Button type="button" variant="outline" onClick={reset}>
            Cancel
          </Button>
        )}
      </Card>
      <div className="grid gap-3">
        {(reports.data ?? []).map((report) => (
          <Card key={report.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{report.name}</p>
              <p className="text-sm text-muted-foreground">{report.reportKey} · last {report.days} days</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => loadEdit(report)}>
                Edit
              </Button>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!confirm(`Delete ${report.name}?`)) return;
                  api
                    .delete(`/platform/saved-reports/${report.id}?branchId=${branchId}`)
                    .then(() => {
                      toast.success("Report deleted");
                      if (editingId === report.id) reset();
                      if (run?.saved.id === report.id) setRun(null);
                      refresh();
                    })
                    .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not delete"));
                }}
              >
                Delete
              </Button>
            </div>
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
