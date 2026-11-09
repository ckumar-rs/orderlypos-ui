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

/** Leave entitlements + India statutory payroll rates (branch_settings). */
export function TeamHrCard({
  branchId,
  branch,
}: {
  branchId: string | null;
  branch: BranchSettings;
}) {
  const update = useUpdateBranchSettings(branchId);
  const [annual, setAnnual] = useState(String(branch.leaveAnnualDays ?? 18));
  const [sick, setSick] = useState(String(branch.leaveSickDays ?? 12));
  const [statutory, setStatutory] = useState(branch.payrollStatutoryEnabled !== false);
  const [pfRate, setPfRate] = useState(String(branch.payrollPfRate ?? 0.12));
  const [pfCeiling, setPfCeiling] = useState(String(branch.payrollPfWageCeiling ?? 15000));
  const [esiLimit, setEsiLimit] = useState(String(branch.payrollEsiGrossLimit ?? 21000));
  const [esiEmp, setEsiEmp] = useState(String(branch.payrollEsiEmployeeRate ?? 0.0075));
  const [esiEr, setEsiEr] = useState(String(branch.payrollEsiEmployerRate ?? 0.0325));

  useEffect(() => {
    setAnnual(String(branch.leaveAnnualDays ?? 18));
    setSick(String(branch.leaveSickDays ?? 12));
    setStatutory(branch.payrollStatutoryEnabled !== false);
    setPfRate(String(branch.payrollPfRate ?? 0.12));
    setPfCeiling(String(branch.payrollPfWageCeiling ?? 15000));
    setEsiLimit(String(branch.payrollEsiGrossLimit ?? 21000));
    setEsiEmp(String(branch.payrollEsiEmployeeRate ?? 0.0075));
    setEsiEr(String(branch.payrollEsiEmployerRate ?? 0.0325));
  }, [
    branch.leaveAnnualDays,
    branch.leaveSickDays,
    branch.payrollStatutoryEnabled,
    branch.payrollPfRate,
    branch.payrollPfWageCeiling,
    branch.payrollEsiGrossLimit,
    branch.payrollEsiEmployeeRate,
    branch.payrollEsiEmployerRate,
  ]);

  return (
    <Card className="flex max-w-2xl flex-col gap-4 p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Team &amp; payroll</h2>
        <p className="text-sm text-muted-foreground">
          Default leave days and India PF / ESI rates used when running payroll. Staff overrides live on the Team page.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="leave-annual">Annual leave days / year</Label>
          <Input id="leave-annual" inputMode="decimal" value={annual} onChange={(e) => setAnnual(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="leave-sick">Sick leave days / year</Label>
          <Input id="leave-sick" inputMode="decimal" value={sick} onChange={(e) => setSick(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
        <div>
          <p className="text-sm font-medium text-foreground">India statutory deductions</p>
          <p className="text-xs text-muted-foreground">PF, ESI and TDS estimates on draft payroll runs</p>
        </div>
        <Switch checked={statutory} onCheckedChange={setStatutory} />
      </div>
      {statutory && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-rate">PF rate</Label>
            <Input id="pf-rate" inputMode="decimal" value={pfRate} onChange={(e) => setPfRate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-ceiling">PF wage ceiling</Label>
            <Input id="pf-ceiling" inputMode="decimal" value={pfCeiling} onChange={(e) => setPfCeiling(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="esi-limit">ESI gross limit</Label>
            <Input id="esi-limit" inputMode="decimal" value={esiLimit} onChange={(e) => setEsiLimit(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="esi-emp">ESI employee rate</Label>
            <Input id="esi-emp" inputMode="decimal" value={esiEmp} onChange={(e) => setEsiEmp(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="esi-er">ESI employer rate</Label>
            <Input id="esi-er" inputMode="decimal" value={esiEr} onChange={(e) => setEsiEr(e.target.value)} />
          </div>
        </div>
      )}
      <Button
        className="self-start"
        disabled={update.isPending || !branchId}
        onClick={() =>
          update.mutate(
            {
              leaveAnnualDays: Number(annual) || 0,
              leaveSickDays: Number(sick) || 0,
              payrollStatutoryEnabled: statutory,
              payrollPfRate: Number(pfRate) || 0,
              payrollPfWageCeiling: Number(pfCeiling) || 0,
              payrollEsiGrossLimit: Number(esiLimit) || 0,
              payrollEsiEmployeeRate: Number(esiEmp) || 0,
              payrollEsiEmployerRate: Number(esiEr) || 0,
            },
            {
              onSuccess: () => toast.success("Team settings saved"),
              onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not save"),
            },
          )
        }
      >
        Save
      </Button>
    </Card>
  );
}
