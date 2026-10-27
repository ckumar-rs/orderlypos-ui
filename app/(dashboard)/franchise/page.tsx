"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface Score {
  branchId: string;
  name: string;
  orders: number;
  sales: string;
  aov: string;
  covers: number;
  noShows: number;
}

export default function FranchisePage() {
  const { branchId } = useBranch();
  const queryClient = useQueryClient();
  const board = useQuery({
    queryKey: ["franchise"],
    queryFn: () => api.get<{ priceLock: boolean; branches: Score[] }>("/platform/franchise"),
  });
  const [pending, setPending] = useState(false);
  const rows = board.data?.branches ?? [];
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight">Franchise</h1>
        <p className="text-sm text-muted-foreground">This month, across every branch. Locking prices leaves changes to the owner and administrator.</p>
      </div>
      <Card className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium">Price lock</p>
          <p className="text-sm text-muted-foreground">{board.data?.priceLock ? "On" : "Off"}</p>
        </div>
        <Button
          type="button"
          disabled={!branchId || pending}
          onClick={() => {
            setPending(true);
            api
              .put("/platform/franchise", { priceLock: !board.data?.priceLock })
              .then(() => queryClient.invalidateQueries({ queryKey: ["franchise"] }))
              .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not update the lock"))
              .finally(() => setPending(false));
          }}
        >
          {board.data?.priceLock ? "Unlock prices" : "Lock prices"}
        </Button>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <Card key={row.branchId} className="p-4">
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-muted-foreground">
              {row.orders} orders · {row.sales} sales · {row.aov} average · {row.covers} covers · {row.noShows} no-shows
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
