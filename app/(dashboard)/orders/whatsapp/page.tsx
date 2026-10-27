"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OrderSectionNav } from "@/components/orders/order-section-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface WhatsAppView {
  setup: { enabled: boolean; secretConfigured: boolean; webhookPath: string };
  orders: Array<{ id: string; orderNumber: string; status: string; guestName: string | null; notes: string | null; totalAmount: number; items: Array<{ nameSnapshot: string; quantity: number }> }>;
}

export default function WhatsAppOrdersPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const [secret, setSecret] = useState<string | null>(null);
  const data = useQuery({
    queryKey: ["whatsapp-orders", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<WhatsAppView>(`/service/whatsapp?branchId=${branchId}`),
  });
  return (
    <div className="flex flex-col gap-4">
      <OrderSectionNav />
      <div>
        <h1 className="text-2xl font-semibold">WhatsApp orders</h1>
        <p className="text-sm text-muted-foreground">A message that names a dish becomes a takeaway order waiting to be accepted. The call stays off until this branch has a secret.</p>
      </div>
      <Card className="flex flex-col gap-2 p-4">
        <p className="text-sm">{data.data?.setup.enabled ? "Intake is on" : "Intake is off"} · {data.data?.setup.webhookPath}</p>
        <Button type="button" variant="outline" disabled={!branchId} onClick={() => api.post<{ secret: string }>(`/service/whatsapp/enable?branchId=${branchId}`, {}).then((row) => { setSecret(row.secret); toast.success("Secret created"); qc.invalidateQueries({ queryKey: ["whatsapp-orders", branchId] }); }).catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not enable"))}>Create secret</Button>
        {secret ? <p className="font-mono text-xs">Send this once as X-Webhook-Secret: {secret}</p> : null}
      </Card>
      <div className="flex flex-col gap-2">
        {(data.data?.orders ?? []).map((order) => (
          <Card key={order.id} className="p-4">
            <p className="font-medium">#{order.orderNumber} · {order.guestName} · {order.status} · {formatCurrency(order.totalAmount)}</p>
            <p className="text-sm text-muted-foreground">{order.items.map((item) => `${item.quantity}× ${item.nameSnapshot}`).join(", ")}</p>
            {order.notes ? <p className="text-sm">{order.notes}</p> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
