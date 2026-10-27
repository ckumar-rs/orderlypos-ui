"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OrderSectionNav } from "@/components/orders/order-section-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { useManagedOrders } from "@/hooks/use-orders";
import { ApiError, api } from "@/lib/api";

export default function CurbsidePage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const orders = useManagedOrders(branchId, "active");
  const list = useQuery({
    queryKey: ["curbside", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<Array<{ id: string; orderNumber: string; guestName: string | null; vehicleNote: string | null; status: string }>>(`/service/curbside?branchId=${branchId}`),
  });
  const [orderId, setOrderId] = useState("");
  const [vehicle, setVehicle] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <OrderSectionNav />
      <div>
        <h1 className="text-2xl font-semibold">Curbside pickup</h1>
        <p className="text-sm text-muted-foreground">Mark a takeaway bill with the vehicle so the runner can find the guest.</p>
      </div>
      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]">
        <select className="h-10 rounded-md border border-input bg-background px-2" value={orderId} onChange={(e) => setOrderId(e.target.value)} aria-label="Order">
          <option value="">Order</option>
          {(orders.data ?? []).map((order) => <option key={order.id} value={order.id}>#{order.orderNumber}</option>)}
        </select>
        <Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="White Swift, last four 1234" />
        <Button type="button" disabled={!orderId} onClick={() => api.post(`/service/curbside?branchId=${branchId}`, { orderId, vehicleNote: vehicle }).then(() => { toast.success("Marked curbside"); qc.invalidateQueries({ queryKey: ["curbside", branchId] }); }).catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"))}>Save</Button>
      </Card>
      <div className="grid gap-3 md:grid-cols-3">
        {(list.data ?? []).map((row) => (
          <Card key={row.id} className="p-4">
            <p className="font-medium">#{row.orderNumber}</p>
            <p className="text-sm">{row.guestName}</p>
            <p className="text-sm text-muted-foreground">{row.vehicleNote}</p>
            <p className="text-xs">{row.status}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
