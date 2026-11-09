"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface WhatsAppView {
  setup: { enabled: boolean; secretConfigured: boolean; webhookPath: string };
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    guestName: string | null;
    notes: string | null;
    totalAmount: number;
    items: Array<{ nameSnapshot: string; quantity: number }>;
  }>;
}

export default function WhatsAppOrdersPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const data = useQuery({
    queryKey: ["whatsapp-orders", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<WhatsAppView>(`/service/whatsapp?branchId=${branchId}`),
  });
  const setup = data.data?.setup;
  const refresh = () => qc.invalidateQueries({ queryKey: ["whatsapp-orders", branchId] });
  const err = (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : "Something went wrong");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">WhatsApp orders</h1>
        <p className="text-sm text-muted-foreground">
          A message that names a dish becomes a takeaway order waiting to be accepted. A WhatsApp catalog cart arrives
          on this same list. Staff accept it before the kitchen starts, and the cashier confirms payment. The
          name-matching call stays off until this branch has a secret.
        </p>
      </div>
      <Card className="flex flex-col gap-3 p-4">
        <p className="text-sm">
          {setup?.enabled ? "Intake is on" : "Intake is off"}
          {setup?.secretConfigured ? " · secret saved" : " · no secret yet"} · {setup?.webhookPath ?? "…"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!branchId || busy}
            onClick={() => {
              setBusy(true);
              void api
                .post<{ secret: string }>(`/service/whatsapp/enable?branchId=${branchId}`, {})
                .then((row) => {
                  setSecret(row.secret);
                  toast.success(
                    !setup?.secretConfigured
                      ? "Secret created"
                      : setup.enabled
                        ? "Secret rotated"
                        : "Intake turned on with a new secret",
                  );
                  refresh();
                })
                .catch(err)
                .finally(() => setBusy(false));
            }}
          >
            {!setup?.secretConfigured
              ? "Create secret"
              : setup.enabled
                ? "Rotate secret"
                : "Re-enable"}
          </Button>
          {setup?.secretConfigured && setup.enabled ? (
            <Button
              type="button"
              variant="outline"
              disabled={!branchId || busy}
              onClick={() => {
                setBusy(true);
                void api
                  .post(`/service/whatsapp/disable?branchId=${branchId}`, {})
                  .then(() => {
                    setSecret(null);
                    toast.success("Intake turned off");
                    refresh();
                  })
                  .catch(err)
                  .finally(() => setBusy(false));
              }}
            >
              Disable intake
            </Button>
          ) : null}
          {setup?.secretConfigured ? (
            <Button
              type="button"
              variant="outline"
              disabled={!branchId || busy}
              onClick={() => {
                if (!confirm("Remove the WhatsApp intake secret for this branch?")) return;
                setBusy(true);
                void api
                  .delete(`/service/whatsapp?branchId=${branchId}`)
                  .then(() => {
                    setSecret(null);
                    toast.success("Secret revoked");
                    refresh();
                  })
                  .catch(err)
                  .finally(() => setBusy(false));
              }}
            >
              Revoke secret
            </Button>
          ) : null}
        </div>
        {secret ? <p className="font-mono text-xs">Send this once as X-Webhook-Secret: {secret}</p> : null}
      </Card>
      <div className="flex flex-col gap-2">
        {(data.data?.orders ?? []).map((order) => (
          <Card key={order.id} className="p-4">
            <p className="font-medium">
              #{order.orderNumber} · {order.guestName} · {order.status} · {formatCurrency(order.totalAmount)}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.items.map((item) => `${item.quantity}× ${item.nameSnapshot}`).join(", ")}
            </p>
            {order.notes ? <p className="text-sm">{order.notes}</p> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
