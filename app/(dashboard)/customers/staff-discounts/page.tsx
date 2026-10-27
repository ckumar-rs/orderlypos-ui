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

interface Policy {
  id: string;
  percent: string;
  maxAmount: string | null;
  user: { name: string } | null;
  role: { label: string } | null;
}

interface StaffView {
  policies: Policy[];
  staff: { id: string; name: string; role: { label: string } }[];
  roles: { id: string; label: string }[];
}

const selectCls = "h-10 rounded-md border border-input bg-background px-2 text-sm";

export default function StaffDiscountsPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const view = useQuery({
    queryKey: ["employee-discounts", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<StaffView>(`/customers/employee-discounts?branchId=${branchId}`),
  });
  const [kind, setKind] = useState<"user" | "role">("user");
  const [target, setTarget] = useState("");
  const [percent, setPercent] = useState("10");
  const [maxAmount, setMaxAmount] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <CustomerTabs />
      <div>
        <h1 className="text-2xl font-semibold">Staff discounts</h1>
        <p className="text-sm text-muted-foreground">
          A person&apos;s percent is used when that cashier checks Employee discount. A role percent is the fallback, then the restaurant percent. The cap is the most that can come off one bill.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Who</TableHead>
            <TableHead>Percent</TableHead>
            <TableHead>Cap</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(view.data?.policies ?? []).map((policy) => (
            <TableRow key={policy.id}>
              <TableCell>{policy.user?.name ?? policy.role?.label ?? "Staff"}</TableCell>
              <TableCell>{Number(policy.percent)}%</TableCell>
              <TableCell>{policy.maxAmount == null ? "No cap" : formatCurrency(policy.maxAmount)}</TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    api
                      .delete(`/customers/employee-discounts/${policy.id}?branchId=${branchId}`)
                      .then(() => qc.invalidateQueries({ queryKey: ["employee-discounts", branchId] }))
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
        className="grid max-w-4xl gap-2 sm:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          api
            .post(`/customers/employee-discounts?branchId=${branchId}`, {
              ...(kind === "user" ? { userId: target } : { roleId: target }),
              percent: Number(percent),
              maxAmount: maxAmount === "" ? null : Number(maxAmount),
            })
            .then(() => {
              setTarget("");
              toast.success("Staff discount saved");
              qc.invalidateQueries({ queryKey: ["employee-discounts", branchId] });
            })
            .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save it"));
        }}
      >
        <select className={selectCls} value={kind} onChange={(event) => { setKind(event.target.value as "user" | "role"); setTarget(""); }}>
          <option value="user">Staff member</option>
          <option value="role">Role</option>
        </select>
        <select className={selectCls} aria-label="Who receives the discount" value={target} onChange={(event) => setTarget(event.target.value)} required>
          <option value="">Choose</option>
          {kind === "user"
            ? (view.data?.staff ?? []).map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {person.role.label}
                </option>
              ))
            : (view.data?.roles ?? []).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
        </select>
        <Input aria-label="Percent" type="number" min="0" max="100" step="0.01" value={percent} onChange={(event) => setPercent(event.target.value)} />
        <Input aria-label="Cap" type="number" min="0" step="0.01" placeholder="Cap" value={maxAmount} onChange={(event) => setMaxAmount(event.target.value)} />
        <Button type="submit">Add policy</Button>
      </form>
    </div>
  );
}
