"use client";

import { useState } from "react";
import { toast } from "sonner";
import { OrderSectionNav } from "@/components/orders/order-section-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { useManagedOrders } from "@/hooks/use-orders";
import { ApiError, api } from "@/lib/api";

export default function TransferLinesPage() {
  const { branchId } = useBranch();
  const orders = useManagedOrders(branchId, "active");
  const open = (orders.data ?? []).filter((order) => order.status === "OPEN");
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [itemId, setItemId] = useState("");
  const source = open.find((order) => order.id === sourceId);
  return (
    <div className="flex flex-col gap-4">
      <OrderSectionNav />
      <div>
        <h1 className="text-2xl font-semibold">Move a line to another bill</h1>
        <p className="text-sm text-muted-foreground">Both bills stay open. The source bill keeps at least one line.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3 p-4">
          <label className="text-sm" htmlFor="source">From</label>
          <select id="source" className="h-10 rounded-md border border-input bg-background px-2" value={sourceId} onChange={(e) => { setSourceId(e.target.value); setItemId(""); }}>
            <option value="">Open bill</option>
            {open.map((order) => <option key={order.id} value={order.id}>#{order.orderNumber}</option>)}
          </select>
          <label className="text-sm" htmlFor="line">Line</label>
          <select id="line" className="h-10 rounded-md border border-input bg-background px-2" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">Dish</option>
            {(source?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.quantity} × {item.nameSnapshot}</option>)}
          </select>
        </Card>
        <Card className="flex flex-col gap-3 p-4">
          <label className="text-sm" htmlFor="target">To</label>
          <select id="target" className="h-10 rounded-md border border-input bg-background px-2" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">Open bill</option>
            {open.filter((order) => order.id !== sourceId).map((order) => <option key={order.id} value={order.id}>#{order.orderNumber}</option>)}
          </select>
          <Button
            type="button"
            disabled={!branchId || !sourceId || !targetId || !itemId}
            onClick={() =>
              api.post(`/orders/${sourceId}/move-item?branchId=${branchId}`, { orderItemId: itemId, targetOrderId: targetId })
                .then(() => { toast.success("Line moved"); setItemId(""); })
                .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not move the line"))
            }
          >
            Move line
          </Button>
        </Card>
      </div>
    </div>
  );
}
