"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface Till {
  openedAt: string;
  openingFloat: number;
  expectedCash: number;
  openedBy: { name: string };
}

export default function TillPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const till = useQuery({
    queryKey: ["till", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<Till | null>(`/service/till?branchId=${branchId}`),
  });
  const [opening, setOpening] = useState("0");
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <Link href="/accounting" className="text-sm text-muted-foreground">Accounting</Link>
      <div>
        <h1 className="text-2xl font-semibold">Shift till</h1>
        <p className="text-sm text-muted-foreground">Expected cash is the opening float plus cash taken since open, minus cash refunds. This is separate from the daily cash close.</p>
      </div>
      {till.data ? (
        <Card className="flex flex-col gap-3 p-4">
          <p>Opened by {till.data.openedBy.name} at {new Date(till.data.openedAt).toLocaleString()}</p>
          <p>Float {formatCurrency(till.data.openingFloat)}</p>
          <p className="text-2xl font-semibold">Expected {formatCurrency(till.data.expectedCash)}</p>
          <Input value={counted} onChange={(e) => setCounted(e.target.value)} placeholder="Counted cash" inputMode="decimal" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" />
          <Button type="button" onClick={() => api.post(`/service/till/close?branchId=${branchId}`, { countedCash: Number(counted), note }).then(() => { toast.success("Till closed"); qc.invalidateQueries({ queryKey: ["till", branchId] }); }).catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not close"))}>Close till</Button>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-sm text-muted-foreground">No till is open.</p>
          <Input value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="Opening float" inputMode="decimal" />
          <Button type="button" onClick={() => api.post(`/service/till/open?branchId=${branchId}`, { openingFloat: Number(opening) }).then(() => { toast.success("Till opened"); qc.invalidateQueries({ queryKey: ["till", branchId] }); }).catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not open"))}>Open till</Button>
        </Card>
      )}
    </div>
  );
}
