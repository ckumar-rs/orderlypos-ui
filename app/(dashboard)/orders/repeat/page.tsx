"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OrderSectionNav } from "@/components/orders/order-section-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { useCustomers } from "@/hooks/use-customers";
import { ApiError, api } from "@/lib/api";

interface RepeatLine {
  id: string;
  nameSnapshot: string;
  quantity: number;
}

export default function RepeatOrderPage() {
  const { branchId } = useBranch();
  const customers = useCustomers(branchId);
  const [customerId, setCustomerId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [lines, setLines] = useState<RepeatLine[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!branchId || !customerId) {
      setLines([]);
      return;
    }
    api
      .get<{ orderNumber: string; items: RepeatLine[] }>(
        `/orders/last-for-customer?branchId=${branchId}&customerId=${customerId}`,
      )
      .then((order) => {
        setOrderNumber(order.orderNumber);
        setLines(order.items);
        setPicked(order.items.map((item) => item.id));
      })
      .catch(() => {
        setOrderNumber("");
        setLines([]);
        setPicked([]);
      });
  }, [branchId, customerId]);

  const send = (itemIds: string[]) => {
    setPending(true);
    api
      .post(`/orders/repeat-items?branchId=${branchId}`, { customerId, itemIds })
      .then(() => toast.success("Those dishes are on a new bill"))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not repeat"))
      .finally(() => setPending(false));
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <OrderSectionNav />
      <div>
        <h1 className="text-2xl font-semibold">Repeat dishes from an earlier bill</h1>
        <p className="text-sm text-muted-foreground">
          Pick the dishes to put on a new bill. The whole last order is still one tap.
        </p>
      </div>
      <Card className="flex flex-col gap-3 p-4">
        <label className="text-sm" htmlFor="guest">Guest</label>
        <select
          id="guest"
          className="h-10 rounded-md border border-input bg-background px-2"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
        >
          <option value="">Select a guest</option>
          {(customers.data ?? []).map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name || customer.phone || customer.id}
            </option>
          ))}
        </select>
        {orderNumber ? <p className="text-sm text-muted-foreground">Last paid bill {orderNumber}</p> : null}
        <div className="flex flex-col gap-2">
          {lines.map((line) => (
            <label key={line.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={picked.includes(line.id)}
                onChange={(event) =>
                  setPicked((current) =>
                    event.target.checked ? [...current, line.id] : current.filter((id) => id !== line.id),
                  )
                }
              />
              {line.quantity}× {line.nameSnapshot}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="button" disabled={!customerId || picked.length === 0 || pending} onClick={() => send(picked)}>
            Repeat selected
          </Button>
          <Button type="button" variant="outline" disabled={!customerId || lines.length === 0 || pending} onClick={() => send(lines.map((line) => line.id))}>
            Repeat whole bill
          </Button>
        </div>
      </Card>
    </div>
  );
}
