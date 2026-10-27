"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { HouseForm, type HouseRow } from "@/components/settings/commerce-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";

export default function HouseSettingsPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const house = useQuery({
    queryKey: ["commerce-house", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<HouseRow[]>(`/commerce/house-accounts?branchId=${branchId}`),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["commerce-house", branchId] });
  return (
    <div className="flex flex-col gap-4">
      <SettingsTabs />
      <div>
        <h1 className="text-lg font-semibold">House accounts</h1>
        <p className="text-sm text-muted-foreground">
          Name, customer, credit limit, and notes are set here. The balance changes only when an advance or a charge is posted.
        </p>
      </div>
      {house.isLoading ? <Skeleton className="h-40 w-full" /> : null}
      {(house.data ?? []).map((row) => (
        <HouseForm key={row.id} branchId={branchId!} row={row} onSaved={refresh} />
      ))}
      {branchId ? <HouseForm branchId={branchId} onSaved={refresh} /> : null}
    </div>
  );
}
