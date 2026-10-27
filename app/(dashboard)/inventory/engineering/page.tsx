"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

const LABEL: Record<string, string> = {
  STAR: "Star",
  PLOWHORSE: "Plowhorse",
  PUZZLE: "Puzzle",
  DOG: "Dog",
};

interface Row {
  id: string;
  name: string;
  sold: number;
  price: number;
  foodCost: number;
  margin: number;
  contribution: number;
  menuClass: string;
}

export default function EngineeringPage() {
  const { branchId } = useBranch();
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 29 * 86_400_000)));
  const [to, setTo] = useState(() => iso(new Date()));
  const report = useQuery({
    queryKey: ["menu-engineering", branchId, from, to],
    enabled: Boolean(branchId) && from <= to,
    queryFn: () => api.get<{ rows: Row[] }>(`/inventory/engineering?branchId=${branchId}&from=${from}&to=${to}`),
  });
  const counts = (report.data?.rows ?? []).reduce<Record<string, number>>((map, row) => {
    map[row.menuClass] = (map[row.menuClass] ?? 0) + 1;
    return map;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <InventoryTabs />
      <div>
        <h1 className="text-2xl font-semibold">Menu engineering</h1>
        <p className="text-sm text-muted-foreground">
          Stars sell well with a high margin. Plowhorses sell well with a low margin. Puzzles have margin and few sales. Dogs are low on both. The split is the median of this list.
        </p>
      </div>
      <div className="flex gap-2">
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From" />
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {Object.entries(LABEL).map(([key, label]) => (
          <div key={key} className="rounded-lg border border-border p-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold">{counts[key] ?? 0}</p>
          </div>
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dish</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Sold</TableHead>
            <TableHead>Margin</TableHead>
            <TableHead>Contribution</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(report.data?.rows ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{LABEL[row.menuClass] ?? row.menuClass}</TableCell>
              <TableCell>{row.sold}</TableCell>
              <TableCell>{formatCurrency(row.margin)}</TableCell>
              <TableCell>{formatCurrency(row.contribution)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
