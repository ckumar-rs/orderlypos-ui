"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useUpdateBranchSettings,
  type BranchSettings,
} from "@/hooks/use-settings";
import { ApiError } from "@/lib/api";

/** Expense categories, approval, and cash variance warn threshold. */
export function AccountingCard({
  branchId,
  branch,
}: {
  branchId: string | null;
  branch: BranchSettings;
}) {
  const update = useUpdateBranchSettings(branchId);
  const [categories, setCategories] = useState(
    (branch.expenseCategories ?? []).join(", "),
  );
  const [requireApproval, setRequireApproval] = useState(
    branch.expenseRequireApproval !== false,
  );
  const [varianceWarn, setVarianceWarn] = useState(
    String(branch.cashVarianceWarnAmount ?? 100),
  );
  const [pettyCashInTillClose, setPettyCashInTillClose] = useState(
    branch.pettyCashInTillClose === true,
  );

  useEffect(() => {
    setCategories((branch.expenseCategories ?? []).join(", "));
    setRequireApproval(branch.expenseRequireApproval !== false);
    setVarianceWarn(String(branch.cashVarianceWarnAmount ?? 100));
    setPettyCashInTillClose(branch.pettyCashInTillClose === true);
  }, [
    branch.expenseCategories,
    branch.expenseRequireApproval,
    branch.cashVarianceWarnAmount,
    branch.pettyCashInTillClose,
  ]);

  return (
    <Card className="flex max-w-2xl flex-col gap-4 p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Accounting</h2>
        <p className="text-sm text-muted-foreground">
          Expense categories, approval, and cash-close variance warnings for this branch.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-cats">Expense categories</Label>
        <Input
          id="expense-cats"
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          placeholder="Rent, Utilities, Supplies…"
        />
        <p className="text-xs text-muted-foreground">Comma-separated. Shown in the Expenses picker.</p>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
        <div>
          <p className="text-sm font-medium text-foreground">Require expense approval</p>
          <p className="text-xs text-muted-foreground">
            Off = new expenses post as approved immediately
          </p>
        </div>
        <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
        <div>
          <p className="text-sm font-medium text-foreground">Count petty cash OUT in till close</p>
          <p className="text-xs text-muted-foreground">
            When on, petty cash taken out the same day reduces expected till cash at day close
          </p>
        </div>
        <Switch checked={pettyCashInTillClose} onCheckedChange={setPettyCashInTillClose} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="variance-warn">Cash variance warn amount</Label>
        <Input
          id="variance-warn"
          inputMode="decimal"
          value={varianceWarn}
          onChange={(e) => setVarianceWarn(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Highlight day-close when |variance| is at least this. 0 = never.</p>
      </div>
      <Button
        className="self-start"
        disabled={update.isPending || !branchId}
        onClick={() =>
          update.mutate(
            {
              expenseCategories: categories
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean)
                .join(","),
              expenseRequireApproval: requireApproval,
              cashVarianceWarnAmount: Number(varianceWarn) || 0,
              pettyCashInTillClose,
            },
            {
              onSuccess: () => toast.success("Accounting settings saved"),
              onError: (e) =>
                toast.error(e instanceof ApiError ? e.message : "Could not save"),
            },
          )
        }
      >
        Save
      </Button>
    </Card>
  );
}
