"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";

interface Bi {
  orders: number;
  sales: string;
  days: { day: string; sales: string }[];
  channels: { type: string; sales: string }[];
}

export default function BusinessPage() {
  const { branchId } = useBranch();
  const bi = useQuery({
    queryKey: ["bi", branchId],
    queryFn: () => api.get<Bi>(`/platform/bi?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const max = Math.max(1, ...(bi.data?.days.map((day) => Number(day.sales)) ?? [1]));
  return (
    <div className="flex flex-col gap-4">
      <Link href="/reports" className="text-sm underline">Reports</Link>
      <div>
        <h1 className="text-2xl font-semibold">Business</h1>
        <p className="text-sm text-muted-foreground">Paid bills for the last 14 days.</p>
      </div>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">{bi.data?.orders ?? 0} orders · {bi.data?.sales ?? "0.00"}</p>
        <div className="mt-4 flex items-end gap-1">
          {(bi.data?.days ?? []).map((day) => (
            <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-sm bg-primary" style={{ height: `${Math.max(4, (Number(day.sales) / max) * 120)}px` }} />
              <span className="text-[10px] text-muted-foreground">{day.day.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-3">
        {(bi.data?.channels ?? []).map((channel) => (
          <Card key={channel.type} className="p-4">
            <p className="font-medium">{channel.type}</p>
            <p className="text-sm text-muted-foreground">{channel.sales}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
