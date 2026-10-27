"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useMenuItems,
  useMenuRuleActions,
  useSalesChannels,
} from "@/hooks/use-menu";
import { ApiError } from "@/lib/api";

const ORDER_TYPES = [
  "DINE_IN",
  "TAKEAWAY",
  "DELIVERY",
  "DRIVE_THRU",
  "QR_ORDER",
  "KIOSK",
  "PHONE",
] as const;

export function ChannelsCard({ branchId }: { branchId: string | null }) {
  const { data: channels } = useSalesChannels(branchId);
  const { data: items } = useMenuItems(branchId);
  const actions = useMenuRuleActions(branchId);
  const [name, setName] = useState("");
  const [markup, setMarkup] = useState("0");
  const [orderType, setOrderType] = useState("");
  const [foodPlatform, setFoodPlatform] = useState("");

  const create = () =>
    actions.createChannel.mutate(
      {
        name,
        markupPercent: Number(markup) || 0,
        orderType: (orderType || undefined) as never,
        foodPlatform: (foodPlatform || undefined) as never,
      },
      {
        onSuccess: () => {
          toast.success(`Channel "${name}" added`);
          setName("");
          setMarkup("0");
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not add channel"),
      },
    );

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Channel prices</h2>
        <p className="text-xs text-muted-foreground">
          Name a price list and a markup, or set a dish price per channel. Matching uses the order type or platform you attach here.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input placeholder="Name (e.g. Zomato)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Markup %" inputMode="decimal" value={markup} onChange={(e) => setMarkup(e.target.value)} />
        <select
          aria-label="Order type"
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
        >
          <option value="">Any order type</option>
          {ORDER_TYPES.map((type) => (
            <option key={type} value={type}>{type.replace("_", " ")}</option>
          ))}
        </select>
        <select
          aria-label="Platform"
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
          value={foodPlatform}
          onChange={(e) => setFoodPlatform(e.target.value)}
        >
          <option value="">No platform</option>
          <option value="ZOMATO">Zomato</option>
          <option value="SWIGGY">Swiggy</option>
        </select>
        <Button disabled={!name.trim() || actions.createChannel.isPending} onClick={create}>
          Add channel
        </Button>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {(channels ?? []).map((channel) => (
          <div key={channel.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <p>
              <span className="font-medium">{channel.name}</span>
              <span className="text-muted-foreground">
                {` · ${Number(channel.markupPercent)}%`}
                {channel.orderType ? ` · ${channel.orderType}` : ""}
                {channel.foodPlatform ? ` · ${channel.foodPlatform}` : ""}
                {channel.isDefault ? " · default" : ""}
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  actions.updateChannel.mutate({
                    id: channel.id,
                    dto: { isDefault: !channel.isDefault },
                  })
                }
              >
                {channel.isDefault ? "Default" : "Make default"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => confirm(`Delete ${channel.name}?`) && actions.deleteChannel.mutate(channel.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      {(channels ?? []).length > 0 && (items ?? []).length > 0 && (
        <p className="text-xs text-muted-foreground">
          {items?.length} dishes use the channel markup unless you save an override on the dish editor.
        </p>
      )}
    </Card>
  );
}
