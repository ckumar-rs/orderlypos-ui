"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function FloorReportPage() {
  const { branchId } = useBranch();
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 6 * 86_400_000)));
  const [to, setTo] = useState(() => iso(new Date()));
  const report = useQuery({
    queryKey: ["floor-report", branchId, from, to],
    enabled: Boolean(branchId) && from <= to,
    queryFn: () => api.get<{ covers: number; turns: number; tablesUsed: number; turnoverPerTable: number; coversPerDay: number; sales: number }>(`/service/floor-report?branchId=${branchId}&from=${from}&to=${to}`),
  });
  const stats = [
    ["Covers", String(report.data?.covers ?? 0)],
    ["Turns", String(report.data?.turns ?? 0)],
    ["Tables used", String(report.data?.tablesUsed ?? 0)],
    ["Turns per table", String(report.data?.turnoverPerTable ?? 0)],
    ["Covers per day", String(report.data?.coversPerDay ?? 0)],
    ["Sales", formatCurrency(report.data?.sales ?? 0)],
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 text-sm">
        <Link href="/reports">Reports</Link>
        <Link href="/reports/attention">Attention</Link>
      </div>
      <h1 className="text-2xl font-semibold">Floor</h1>
      <div className="flex gap-2">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
