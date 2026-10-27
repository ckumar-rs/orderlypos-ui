"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { TerminalForm, type TerminalRow } from "@/components/settings/commerce-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";

export default function TerminalsSettingsPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const terminals = useQuery({
    queryKey: ["commerce-terminals", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<TerminalRow[]>(`/commerce/terminals?branchId=${branchId}`),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["commerce-terminals", branchId] });
  return (
    <div className="flex flex-col gap-4">
      <SettingsTabs />
      <div>
        <h1 className="text-lg font-semibold">Card terminals</h1>
        <p className="text-sm text-muted-foreground">
          Pine Labs, Mosambee, Mswipe, and PAX stay off until a terminal here has a push URL and secret.
        </p>
      </div>
      {terminals.isLoading ? <Skeleton className="h-40 w-full" /> : null}
      {(terminals.data ?? []).map((row) => (
        <TerminalForm key={row.id} branchId={branchId!} row={row} onSaved={refresh} />
      ))}
      {branchId ? <TerminalForm branchId={branchId} onSaved={refresh} /> : null}
    </div>
  );
}
