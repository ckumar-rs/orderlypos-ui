"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GatewayCard, type GatewayRow } from "@/components/settings/commerce-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function PaymentsSettingsPage() {
  const qc = useQueryClient();
  const gateways = useQuery({
    queryKey: ["commerce-gateways"],
    queryFn: () => api.get<GatewayRow[]>("/commerce/gateways"),
  });
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Payment gateways</h1>
        <p className="text-sm text-muted-foreground">
          Razorpay, PhonePe, Paytm, and Stripe stay off until this page stores a URL and secret. Preferred method, order, and cash label are set under Settings → Payments, mail, and Tally.
        </p>
      </div>
      {gateways.isLoading ? <Skeleton className="h-40 w-full" /> : null}
      {(gateways.data ?? []).map((row) => (
        <GatewayCard key={row.provider} row={row} onSaved={() => qc.invalidateQueries({ queryKey: ["commerce-gateways"] })} />
      ))}
    </div>
  );
}
