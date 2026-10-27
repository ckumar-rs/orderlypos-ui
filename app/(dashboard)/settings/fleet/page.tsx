"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { FleetCard, type FleetRow } from "@/components/settings/commerce-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";

export default function FleetSettingsPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const fleet = useQuery({
    queryKey: ["commerce-fleet", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<FleetRow[]>(`/commerce/fleet?branchId=${branchId}`),
  });
  return (
    <div className="flex flex-col gap-4">
      <SettingsTabs />
      <div>
        <h1 className="text-lg font-semibold">Delivery fleet</h1>
        <p className="text-sm text-muted-foreground">
          Rapido, Dunzo, and Shadowfax stay off until this page stores a dispatch URL and key.
        </p>
      </div>
      {fleet.isLoading ? <Skeleton className="h-40 w-full" /> : null}
      {(fleet.data ?? []).map((row) => (
        <FleetCard
          key={row.provider}
          branchId={branchId!}
          row={row}
          onSaved={() => qc.invalidateQueries({ queryKey: ["commerce-fleet", branchId] })}
        />
      ))}
    </div>
  );
}
