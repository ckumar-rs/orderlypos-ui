"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CustomerTabs } from "@/components/customers/customer-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  cashbackCost: string;
  isActive: boolean;
}

export default function RewardsPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const rewards = useQuery({
    queryKey: ["rewards", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<Reward[]>(`/customers/rewards?branchId=${branchId}`),
  });
  const [name, setName] = useState("");
  const [points, setPoints] = useState("0");
  const [cashback, setCashback] = useState("0");

  return (
    <div className="flex flex-col gap-4">
      <CustomerTabs />
      <div>
        <h1 className="text-2xl font-semibold">Rewards</h1>
        <p className="text-sm text-muted-foreground">
          A catalog item spends loyalty points, cashback, or both. Cashback is not store credit.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reward</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Cashback</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(rewards.data ?? []).map((reward) => (
            <TableRow key={reward.id}>
              <TableCell>{reward.name}</TableCell>
              <TableCell>{reward.pointsCost}</TableCell>
              <TableCell>{formatCurrency(reward.cashbackCost)}</TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    api
                      .delete(`/customers/rewards/${reward.id}?branchId=${branchId}`)
                      .then(() => qc.invalidateQueries({ queryKey: ["rewards", branchId] }))
                      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not remove it"))
                  }
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <form
        className="grid max-w-3xl gap-2 sm:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          api
            .post(`/customers/rewards?branchId=${branchId}`, {
              name,
              pointsCost: Number(points) || 0,
              cashbackCost: Number(cashback) || 0,
            })
            .then(() => {
              setName("");
              toast.success("Reward added");
              qc.invalidateQueries({ queryKey: ["rewards", branchId] });
            })
            .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not add the reward"));
        }}
      >
        <Input aria-label="Reward name" placeholder="Free dessert" value={name} onChange={(event) => setName(event.target.value)} required />
        <Input aria-label="Points cost" type="number" min="0" value={points} onChange={(event) => setPoints(event.target.value)} />
        <Input aria-label="Cashback cost" type="number" min="0" step="0.01" value={cashback} onChange={(event) => setCashback(event.target.value)} />
        <Button type="submit">Add reward</Button>
      </form>
    </div>
  );
}
