"use client";

import { Percent, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MenuSectionHeader } from "@/components/menu/menu-section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useMenuItems,
  useMenuRuleActions,
  useSalesChannels,
} from "@/hooks/use-menu";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const ORDER_TYPES = [
  "DINE_IN",
  "TAKEAWAY",
  "DELIVERY",
  "DRIVE_THRU",
  "QR_ORDER",
  "KIOSK",
  "PHONE",
] as const;

function platformTone(platform: string | null) {
  if (platform === "ZOMATO") return "bg-destructive/10 text-destructive";
  if (platform === "SWIGGY") return "bg-warning/15 text-foreground";
  return "bg-secondary text-muted-foreground";
}

export function ChannelsCard({ branchId }: { branchId: string | null }) {
  const { data: channels } = useSalesChannels(branchId);
  const { data: items } = useMenuItems(branchId);
  const actions = useMenuRuleActions(branchId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [markup, setMarkup] = useState("0");
  const [orderType, setOrderType] = useState("");
  const [foodPlatform, setFoodPlatform] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setMarkup("0");
    setOrderType("");
    setFoodPlatform("");
  };

  const save = () => {
    const dto = {
      name,
      markupPercent: Number(markup) || 0,
      orderType: (orderType || null) as never,
      foodPlatform: (foodPlatform || null) as never,
    };
    if (editingId) {
      actions.updateChannel.mutate(
        { id: editingId, dto },
        {
          onSuccess: () => {
            toast.success(`Channel "${name}" updated`);
            resetForm();
          },
          onError: (err) =>
            toast.error(err instanceof ApiError ? err.message : "Could not update channel"),
        },
      );
      return;
    }
    actions.createChannel.mutate(dto, {
      onSuccess: () => {
        toast.success(`Channel "${name}" added`);
        resetForm();
      },
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not add channel"),
    });
  };

  return (
    <Card className="flex flex-col gap-5 p-4 sm:p-6">
      <MenuSectionHeader
        title="Channel pricing"
        description="Name a price list and markup, or set a dish price per channel in the dish editor. Matching uses the order type or platform you attach here."
      />

      <div className="rounded-xl border border-border bg-secondary/20 p-4">
        <h3 className="text-sm font-semibold text-foreground">
          {editingId ? "Edit channel" : "Add channel"}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Example: Zomato with a markup, or Dine-in as the default list.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-1.5 lg:col-span-1">
            <Label htmlFor="channel-name">Channel name</Label>
            <Input
              id="channel-name"
              placeholder="e.g. Zomato"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-markup">Markup %</Label>
            <div className="relative">
              <Percent className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="channel-markup"
                className="pl-8"
                placeholder="0"
                inputMode="decimal"
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-order-type">Order type</Label>
            <select
              id="channel-order-type"
              aria-label="Order type"
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
            >
              <option value="">Any order type</option>
              {ORDER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-platform">Platform</Label>
            <select
              id="channel-platform"
              aria-label="Platform"
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
              value={foodPlatform}
              onChange={(e) => setFoodPlatform(e.target.value)}
            >
              <option value="">No platform</option>
              <option value="ZOMATO">Zomato</option>
              <option value="SWIGGY">Swiggy</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            {editingId && (
              <Button type="button" variant="outline" className="w-full" onClick={resetForm}>
                Cancel
              </Button>
            )}
            <Button
              className="w-full"
              disabled={
                !name.trim() ||
                actions.createChannel.isPending ||
                actions.updateChannel.isPending
              }
              onClick={save}
            >
              {actions.createChannel.isPending || actions.updateChannel.isPending
                ? "Saving…"
                : editingId
                  ? "Save channel"
                  : "Add channel"}
            </Button>
          </div>
        </div>
      </div>

      {(channels ?? []).length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(channels ?? []).map((channel) => (
            <div
              key={channel.id}
              className={cn(
                "flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
                channel.isDefault && "ring-1 ring-primary/25",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Store className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{channel.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(channel.markupPercent)}% markup
                      {!channel.isActive ? " · inactive" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => {
                      setEditingId(channel.id);
                      setName(channel.name);
                      setMarkup(String(channel.markupPercent ?? "0"));
                      setOrderType(channel.orderType ?? "");
                      setFoodPlatform(channel.foodPlatform ?? "");
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${channel.name}`}
                    onClick={() => {
                      if (!confirm(`Delete ${channel.name}?`)) return;
                      actions.deleteChannel.mutate(channel.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {channel.orderType ? (
                  <Badge variant="secondary" className="font-normal">
                    {channel.orderType.replaceAll("_", " ")}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-normal">
                    Any order type
                  </Badge>
                )}
                {channel.foodPlatform ? (
                  <Badge className={cn("border-0 font-normal", platformTone(channel.foodPlatform))}>
                    {channel.foodPlatform}
                  </Badge>
                ) : null}
                {channel.isDefault ? (
                  <Badge className="border-0 bg-primary/15 font-normal text-primary">Default</Badge>
                ) : null}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                <Label
                  htmlFor={`channel-default-${channel.id}`}
                  className="cursor-pointer text-xs text-muted-foreground"
                >
                  Use as default
                </Label>
                <Switch
                  id={`channel-default-${channel.id}`}
                  size="sm"
                  checked={channel.isDefault}
                  onCheckedChange={() =>
                    actions.updateChannel.mutate({
                      id: channel.id,
                      dto: { isDefault: !channel.isDefault },
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No channels yet. Add Zomato, Swiggy, dine-in, or delivery lists above.
        </div>
      )}

      {(channels ?? []).length > 0 && (items ?? []).length > 0 && (
        <p className="text-xs text-muted-foreground">
          {items?.length} dishes use the channel markup unless you save an override on the dish
          editor.
        </p>
      )}
    </Card>
  );
}
