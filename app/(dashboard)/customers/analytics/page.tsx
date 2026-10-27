"use client";

import { useQuery } from "@tanstack/react-query";
import { CustomerTabs } from "@/components/customers/customer-tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface Row {
  id: string;
  name: string | null;
  phone: string | null;
  visits: number;
  spend: number;
  aov: number;
  averageDaysBetween: number | null;
  visitsPer30Days: number | null;
}

export default function CustomerAnalyticsPage() {
  const { branchId } = useBranch();
  const rows = useQuery({
    queryKey: ["customers", "analytics", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<Row[]>(`/customers/analytics?branchId=${branchId}`),
  });

  return (
    <div className="flex flex-col gap-4">
      <CustomerTabs />
      <div>
        <h1 className="text-2xl font-semibold">Customer analytics</h1>
        <p className="text-sm text-muted-foreground">
          Average order value and how often each guest comes back, from every paid bill.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Visits</TableHead>
            <TableHead>Spend</TableHead>
            <TableHead>AOV</TableHead>
            <TableHead>Days between visits</TableHead>
            <TableHead>Visits / 30 days</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(rows.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="font-medium">{row.name ?? "Unnamed customer"}</div>
                <div className="text-xs text-muted-foreground">{row.phone ?? ""}</div>
              </TableCell>
              <TableCell>{row.visits}</TableCell>
              <TableCell>{formatCurrency(row.spend)}</TableCell>
              <TableCell>{formatCurrency(row.aov)}</TableCell>
              <TableCell>{row.averageDaysBetween ?? "—"}</TableCell>
              <TableCell>{row.visitsPer30Days ?? "—"}</TableCell>
            </TableRow>
          ))}
          {rows.data && rows.data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>No customers yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
