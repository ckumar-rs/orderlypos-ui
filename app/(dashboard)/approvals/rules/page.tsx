"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface Rules {
  approvalDiscountAbove: number | null;
  approvalForVoid: boolean;
  approvalForRefund: boolean;
  noShowFee: number;
}

export default function ApprovalRulesPage() {
  const { branchId } = useBranch();
  const rules = useQuery({
    queryKey: ["approval-rules", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<Rules>(`/service/rules?branchId=${branchId}`),
  });
  const [discount, setDiscount] = useState("");
  const [gateDiscount, setGateDiscount] = useState(false);
  const [voids, setVoids] = useState(false);
  const [refunds, setRefunds] = useState(false);
  const [fee, setFee] = useState("0");
  useEffect(() => {
    if (!rules.data) return;
    setGateDiscount(rules.data.approvalDiscountAbove != null);
    setDiscount(rules.data.approvalDiscountAbove == null ? "" : String(rules.data.approvalDiscountAbove));
    setVoids(rules.data.approvalForVoid);
    setRefunds(rules.data.approvalForRefund);
    setFee(String(rules.data.noShowFee));
  }, [rules.data]);
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <Link href="/approvals" className="text-sm text-muted-foreground">Approvals</Link>
      <div>
        <h1 className="text-2xl font-semibold">Approval rules</h1>
        <p className="text-sm text-muted-foreground">Leave the discount gate empty and the void and refund switches off to keep today's cashier flow. A no-show fee is recorded on the approval list. It does not charge a card.</p>
      </div>
      <Card className="flex flex-col gap-3 p-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={gateDiscount} onChange={(e) => setGateDiscount(e.target.checked)} /> Require approval above this discount percent</label>
        <Input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Percent" inputMode="decimal" disabled={!gateDiscount} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={voids} onChange={(e) => setVoids(e.target.checked)} /> Require approval before a staff void</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={refunds} onChange={(e) => setRefunds(e.target.checked)} /> Require approval before a refund</label>
        <label className="text-sm" htmlFor="fee">No-show fee amount</label>
        <Input id="fee" value={fee} onChange={(e) => setFee(e.target.value)} inputMode="decimal" />
        <Button type="button" onClick={() => api.post(`/service/rules?branchId=${branchId}`, {
          approvalDiscountAbove: gateDiscount ? Number(discount) : null,
          approvalForVoid: voids,
          approvalForRefund: refunds,
          noShowFee: Number(fee),
        }).then(() => toast.success("Rules saved")).catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"))}>Save rules</Button>
      </Card>
    </div>
  );
}
