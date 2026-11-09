"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useUpdateBranchSettings,
  type BranchSettings,
} from "@/hooks/use-settings";

/** Branch GPS origin + radius/stale thresholds for delivery tracking. */
export function DeliveryTrackingSettings({
  branchId,
  branch,
}: {
  branchId: string | null;
  branch: BranchSettings;
}) {
  const update = useUpdateBranchSettings(branchId);
  const [radiusKm, setRadiusKm] = useState(String(branch.deliveryTrackingRadiusKm ?? 5));
  const [staleMinutes, setStaleMinutes] = useState(
    String(branch.deliveryTrackingStaleMinutes ?? 10),
  );
  const [lat, setLat] = useState(
    branch.deliveryTrackingLat != null ? String(branch.deliveryTrackingLat) : "",
  );
  const [lng, setLng] = useState(
    branch.deliveryTrackingLng != null ? String(branch.deliveryTrackingLng) : "",
  );

  useEffect(() => {
    setRadiusKm(String(branch.deliveryTrackingRadiusKm ?? 5));
    setStaleMinutes(String(branch.deliveryTrackingStaleMinutes ?? 10));
    setLat(branch.deliveryTrackingLat != null ? String(branch.deliveryTrackingLat) : "");
    setLng(branch.deliveryTrackingLng != null ? String(branch.deliveryTrackingLng) : "");
  }, [
    branch.deliveryTrackingRadiusKm,
    branch.deliveryTrackingStaleMinutes,
    branch.deliveryTrackingLat,
    branch.deliveryTrackingLng,
  ]);

  return (
    <Card className="flex max-w-xl flex-col gap-3 p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Driver tracking</h2>
        <p className="text-sm text-muted-foreground">
          Set the branch pin and delivery radius (geofence). Open deliveries with no GPS for longer
          than the stale window are flagged on the live map.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="trk-lat">Branch latitude</Label>
          <Input
            id="trk-lat"
            inputMode="decimal"
            placeholder="17.3850"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="trk-lng">Branch longitude</Label>
          <Input
            id="trk-lng"
            inputMode="decimal"
            placeholder="78.4867"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="trk-radius">Radius (km)</Label>
          <Input
            id="trk-radius"
            inputMode="decimal"
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="trk-stale">Stale after (minutes)</Label>
          <Input
            id="trk-stale"
            inputMode="numeric"
            value={staleMinutes}
            onChange={(e) => setStaleMinutes(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (!navigator.geolocation) {
              toast.error("This device cannot share a location");
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setLat(String(pos.coords.latitude));
                setLng(String(pos.coords.longitude));
                toast.success("Filled from this device");
              },
              () => toast.error("Location permission was not granted"),
            );
          }}
        >
          Use this device
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={update.isPending}
          onClick={() =>
            update.mutate(
              {
                deliveryTrackingRadiusKm: Number(radiusKm) || 0,
                deliveryTrackingStaleMinutes: Math.max(1, Number(staleMinutes) || 10),
                deliveryTrackingLat: lat.trim() === "" ? null : Number(lat),
                deliveryTrackingLng: lng.trim() === "" ? null : Number(lng),
              },
              {
                onSuccess: () => toast.success("Tracking settings saved"),
                onError: (e) =>
                  toast.error(e instanceof Error ? e.message : "Could not save"),
              },
            )
          }
        >
          Save
        </Button>
      </div>
    </Card>
  );
}
