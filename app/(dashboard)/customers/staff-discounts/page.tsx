"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  userId: string | null;
  roleId: string | null;
  user: { id: string; name: string } | null;
  role: { id: string; label: string } | null;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kind, setKind] = useState<"user" | "role">("user");
  const [target, setTarget] = useState("");
  const [percent, setPercent] = useState("10");
  const [maxAmount, setMaxAmount] = useState("");
  const [pending, setPending] = useState(false);

  const reset = () => {
    setEditingId(null);
    setKind("user");
    setTarget("");
    setPercent("10");
    setMaxAmount("");
  };

  const loadEdit = (policy: Policy) => {
    setEditingId(policy.id);
    if (policy.userId) {
      setKind("user");
      setTarget(policy.userId);
    } else {
      setKind("role");
      setTarget(policy.roleId ?? "");
    }
    setPercent(String(Number(policy.percent)));
    setMaxAmount(policy.maxAmount == null ? "" : String(Number(policy.maxAmount)));
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ["employee-discounts", branchId] });

  return (
    <div className="flex flex-col gap-4">
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
              <TableCell className="text-right">
                <Button type="button" variant="outline" size="sm" onClick={() => loadEdit(policy)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() =>
                    api
                      .delete(`/customers/employee-discounts/${policy.id}?branchId=${branchId}`)
                      .then(() => {
                        if (editingId === policy.id) reset();
                        return invalidate();
                      })
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
          setPending(true);
          const body = {
            percent: Number(percent),
            maxAmount: maxAmount === "" ? null : Number(maxAmount),
          };
          const req = editingId
            ? api.patch(`/customers/employee-discounts/${editingId}?branchId=${branchId}`, body)
            : api.post(`/customers/employee-discounts?branchId=${branchId}`, {
                ...(kind === "user" ? { userId: target } : { roleId: target }),
                ...body,
              });
          req
            .then(() => {
              toast.success(editingId ? "Staff discount updated" : "Staff discount saved");
              reset();
              return invalidate();
            })
            .catch((error) =>
              toast.error(
                error instanceof ApiError
                  ? error.message
                  : editingId
                    ? "Could not update it"
                    : "Could not save it",
              ),
            )
            .finally(() => setPending(false));
        }}
      >
        <select
          className={selectCls}
          value={kind}
          disabled={Boolean(editingId)}
          onChange={(event) => {
            setKind(event.target.value as "user" | "role");
            setTarget("");
          }}
        >
          <option value="user">Staff member</option>
          <option value="role">Role</option>
        </select>
        <select
          className={selectCls}
          aria-label="Who receives the discount"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          required={!editingId}
          disabled={Boolean(editingId)}
        >
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
        <div className="flex gap-2">
          <Button type="submit" disabled={pending || (!editingId && !target)}>
            {editingId ? "Save" : "Create"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
