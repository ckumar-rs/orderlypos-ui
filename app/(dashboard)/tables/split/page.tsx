"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TableSectionNav } from "@/components/tables/table-section-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { useManagedOrders } from "@/hooks/use-orders";
import { useFloors } from "@/hooks/use-tables";
import { ApiError, api } from "@/lib/api";

function label(number: string, name: string | null) {
  return name ? `${number} · ${name}` : number;
}

export default function SplitTablePage() {
  const { branchId } = useBranch();
  const orders = useManagedOrders(branchId, "active");
  const floors = useFloors(branchId);
  const open = (orders.data ?? []).filter((order) => order.status === "OPEN" && order.type === "DINE_IN" && order.table);
  const [orderId, setOrderId] = useState("");
  const [targetTableId, setTargetTableId] = useState("");
  const [lineIds, setLineIds] = useState<string[]>([]);
  const source = open.find((order) => order.id === orderId);
  const busy = new Set(open.map((order) => order.table?.id).filter((id): id is string => Boolean(id)));
  const free = (floors.data ?? []).flatMap((floor) =>
    floor.tables
      .filter((table) => table.status !== "OUT_OF_SERVICE" && !busy.has(table.id) && table.id !== source?.table?.id)
      .map((table) => ({ ...table, floor: floor.name })),
  );

  return (
    <div className="flex flex-col gap-4">
      <TableSectionNav />
      <div>
        <h1 className="text-2xl font-semibold">Split a table</h1>
        <p className="text-sm text-muted-foreground">
          Move selected dishes onto a new bill at a free table. The original table keeps at least one dish.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3 p-4">
          <label className="text-sm" htmlFor="source-bill">Open table</label>
          <select
            id="source-bill"
            className="h-10 rounded-md border border-input bg-background px-2"
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              setLineIds([]);
            }}
          >
            <option value="">Choose a bill</option>
            {open.map((order) => (
              <option key={order.id} value={order.id}>
                Table {order.table?.number} · #{order.orderNumber}
              </option>
            ))}
          </select>
          <div className="flex flex-col gap-2">
            {(source?.items ?? []).map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lineIds.includes(item.id)}
                  onChange={(e) =>
                    setLineIds((current) =>
                      e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                    )
                  }
                />
                {item.quantity} × {item.nameSnapshot}
              </label>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col gap-3 p-4">
          <label className="text-sm" htmlFor="target-table">New table</label>
          <select
            id="target-table"
            className="h-10 rounded-md border border-input bg-background px-2"
            value={targetTableId}
            onChange={(e) => setTargetTableId(e.target.value)}
          >
            <option value="">Free table</option>
            {free.map((table) => (
              <option key={table.id} value={table.id}>
                {table.floor} · {label(table.number, table.name)}
              </option>
            ))}
          </select>
          <Button
            type="button"
            disabled={!branchId || !orderId || !targetTableId || lineIds.length === 0}
            onClick={() =>
              api
                .post(`/orders/${orderId}/split-table?branchId=${branchId}`, {
                  targetTableId,
                  orderItemIds: lineIds,
                })
                .then(() => {
                  toast.success("Table split into two bills");
                  setLineIds([]);
                  setTargetTableId("");
                })
                .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not split the table"))
            }
          >
            Split onto that table
          </Button>
        </Card>
      </div>
    </div>
  );
}
