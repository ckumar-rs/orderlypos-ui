"use client";

import { Copy, ExternalLink, KeyRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useSetPickupBoard,
  useUpdateBranchSettings,
  useUpdateRestaurantSettings,
  type BranchSettings,
  type RestaurantSettings,
} from "@/hooks/use-settings";

/** Settings > Ordering & pickup — stored on the branch, not hardcoded. */
export function OrderingPickupCard({
  branchId,
  branch,
  restaurant,
  cashLabel = "Cash",
}: {
  branchId: string | null;
  branch: BranchSettings;
  restaurant?: RestaurantSettings;
  /** From restaurant_settings.cash_label */
  cashLabel?: string;
}) {
  const update = useUpdateBranchSettings(branchId);
  const updateRestaurant = useUpdateRestaurantSettings(branchId);
  const setPickup = useSetPickupBoard(branchId);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [waMessage, setWaMessage] = useState(
    restaurant?.billPayLinkWhatsappMessage ??
      "Here is your bill for order {order}: {url}",
  );
  const pickupUrl =
    branch.pickupDisplayToken && typeof window !== "undefined"
      ? `${window.location.origin}/pickup/${branch.pickupDisplayToken}`
      : null;

  const save = (dto: {
    payBeforeKitchenKiosk?: boolean;
    payBeforeKitchenTakeaway?: boolean;
    guestPaidClaimEnabled?: boolean;
    guestCodRequestEnabled?: boolean;
    guestWaiterEnabled?: boolean;
    guestBillEnabled?: boolean;
  }) =>
    update.mutate(dto, {
      onSuccess: () => toast.success("Saved"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
    });

  const runPickup = (action: "enable" | "rotate" | "disable", done: string) =>
    setPickup.mutate(action, {
      onSuccess: () => {
        toast.success(done);
        setConfirmRotate(false);
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Could not update the pickup board"),
    });

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-[18px] font-medium text-foreground">Ordering & pickup</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Stored in the branch settings table. Nothing is forced in code until you turn it on here.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <span className="text-sm">Till: send guest pay link</span>
          <Switch
            checked={restaurant?.billPayLinkEnabled !== false}
            onCheckedChange={(v) =>
              updateRestaurant.mutate(
                { billPayLinkEnabled: v },
                {
                  onSuccess: () => toast.success("Saved"),
                  onError: (e) =>
                    toast.error(e instanceof Error ? e.message : "Could not save"),
                },
              )
            }
            aria-label="Enable guest bill pay links"
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <span className="text-sm">Pay before kitchen (kiosk)</span>
          <Switch
            checked={Boolean(branch.payBeforeKitchenKiosk)}
            onCheckedChange={(v) => save({ payBeforeKitchenKiosk: v })}
            aria-label="Pay before kitchen for kiosk"
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <span className="text-sm">Pay before kitchen (online takeaway)</span>
          <Switch
            checked={Boolean(branch.payBeforeKitchenTakeaway)}
            onCheckedChange={(v) => save({ payBeforeKitchenTakeaway: v })}
            aria-label="Pay before kitchen for online takeaway"
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <span className="text-sm">Table QR: call waiter</span>
          <Switch
            checked={branch.guestWaiterEnabled !== false}
            onCheckedChange={(v) => save({ guestWaiterEnabled: v })}
            aria-label="Enable call waiter"
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <span className="text-sm">Table QR: request bill</span>
          <Switch
            checked={branch.guestBillEnabled !== false}
            onCheckedChange={(v) => save({ guestBillEnabled: v })}
            aria-label="Enable request bill"
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <span className="text-sm">Table QR: guest “I paid”</span>
          <Switch
            checked={Boolean(branch.guestPaidClaimEnabled)}
            onCheckedChange={(v) => save({ guestPaidClaimEnabled: v })}
            aria-label="Enable guest I paid signal"
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <span className="text-sm">Table QR: guest “Want {cashLabel}”</span>
          <Switch
            checked={Boolean(branch.guestCodRequestEnabled)}
            onCheckedChange={(v) => save({ guestCodRequestEnabled: v })}
            aria-label={`Enable guest ${cashLabel} request`}
          />
        </label>
      </div>

      <div className="space-y-2 rounded-lg border border-border px-3 py-3 sm:col-span-2">
        <Label htmlFor="pay-link-wa">Pay link WhatsApp message</Label>
        <p className="text-xs text-muted-foreground">
          Use {"{url}"} for the link and {"{order}"} for the order number. Needs a UPI id in
          Restaurant settings.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="pay-link-wa"
            value={waMessage}
            onChange={(e) => setWaMessage(e.target.value)}
            maxLength={400}
          />
          <Button
            type="button"
            variant="outline"
            disabled={updateRestaurant.isPending}
            onClick={() =>
              updateRestaurant.mutate(
                { billPayLinkWhatsappMessage: waMessage },
                {
                  onSuccess: () => toast.success("Saved"),
                  onError: (e) =>
                    toast.error(e instanceof Error ? e.message : "Could not save"),
                },
              )
            }
          >
            Save message
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium text-foreground">Pickup queue board</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Show takeaway and kiosk tokens on a screen at the counter. Enable to get a public URL.
        </p>
        {!branch.pickupDisplayToken ? (
          <Button
            className="mt-3"
            disabled={setPickup.isPending}
            onClick={() => runPickup("enable", "Pickup board enabled")}
          >
            Enable pickup board
          </Button>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <Label htmlFor="pickup-url">Board address</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                <input
                  id="pickup-url"
                  readOnly
                  value={pickupUrl ?? ""}
                  className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Copy pickup board address"
                  onClick={() => {
                    if (!pickupUrl) return;
                    void navigator.clipboard.writeText(pickupUrl);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <a
                  href={pickupUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open pickup board"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
            {pickupUrl ? (
              <div className="w-fit rounded-lg bg-white p-2" aria-label="QR code of the pickup board">
                <QRCodeSVG value={pickupUrl} size={120} level="M" marginSize={1} />
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              {confirmRotate ? (
                <>
                  <span className="text-sm">The current board address will stop working. Continue?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={setPickup.isPending}
                    onClick={() => runPickup("rotate", "New pickup board address created")}
                  >
                    Yes, replace it
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmRotate(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setConfirmRotate(true)}>
                    <KeyRound className="h-4 w-4" /> Create new address
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={setPickup.isPending}
                    onClick={() => runPickup("disable", "Pickup board turned off")}
                  >
                    Turn board off
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
