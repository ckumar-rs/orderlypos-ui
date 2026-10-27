"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TableSectionNav } from "@/components/tables/table-section-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCustomers } from "@/hooks/use-customers";
import { useBranch } from "@/hooks/use-branch";
import { useManagedOrders } from "@/hooks/use-orders";
import { useFloors } from "@/hooks/use-tables";
import { ApiError, api } from "@/lib/api";

export default function MovePartyPage() {
  const { branchId } = useBranch();
  const orders = useManagedOrders(branchId, "active");
  const floors = useFloors(branchId);
  const customers = useCustomers(branchId);
  const open = (orders.data ?? []).filter((order) => order.status === "OPEN" && order.type === "DINE_IN" && order.table);
  const [orderId, setOrderId] = useState("");
  const [targetTableId, setTargetTableId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const source = open.find((order) => order.id === orderId);
  const busy = new Set(open.map((order) => order.table?.id).filter((id): id is string => Boolean(id)));
  const free = (floors.data ?? []).flatMap((floor) =>
    floor.tables
      .filter((table) => table.status !== "OUT_OF_SERVICE" && !busy.has(table.id))
      .map((table) => ({ ...table, floor: floor.name })),
  );

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <TableSectionNav />
      <div>
        <h1 className="text-2xl font-semibold">Move a party</h1>
        <p className="text-sm text-muted-foreground">
          The open bill, its guest, and an optional customer profile move together onto a free table.
        </p>
      </div>
      <Card className="flex flex-col gap-3 p-4">
        <label className="text-sm" htmlFor="party">From</label>
        <select id="party" className="h-10 rounded-md border border-input bg-background px-2" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
          <option value="">Occupied table</option>
          {open.map((order) => (
            <option key={order.id} value={order.id}>
              Table {order.table?.number} · #{order.orderNumber}
              {order.guestName ? ` · ${order.guestName}` : ""}
              {order.customer?.name ? ` · ${order.customer.name}` : ""}
            </option>
          ))}
        </select>
        <label className="text-sm" htmlFor="destination">To</label>
        <select id="destination" className="h-10 rounded-md border border-input bg-background px-2" value={targetTableId} onChange={(e) => setTargetTableId(e.target.value)}>
          <option value="">Free table</option>
          {free.map((table) => (
            <option key={table.id} value={table.id}>{table.floor} · {table.number}</option>
          ))}
        </select>
        <label className="text-sm" htmlFor="customer">Customer on the bill</label>
        <select id="customer" className="h-10 rounded-md border border-input bg-background px-2" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">{source?.customer?.name ? `Keep ${source.customer.name}` : "Keep the current customer"}</option>
          {(customers.data ?? []).map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name || customer.phone || "Customer"}</option>
          ))}
        </select>
        <Button
          type="button"
          disabled={!branchId || !source || !targetTableId}
          onClick={() =>
            api
              .patch(`/orders/${source?.id}?branchId=${branchId}`, {
                tableId: targetTableId,
                ...(customerId ? { customerId } : {}),
              })
              .then(() => {
                toast.success("Party moved");
                setOrderId("");
                setTargetTableId("");
                setCustomerId("");
              })
              .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not move the party"))
          }
        >
          Move
        </Button>
      </Card>
    </div>
  );
}
