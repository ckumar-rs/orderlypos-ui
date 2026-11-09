"use client";

import { useMemo, useState } from "react";
import { DeliveryMap, type MapMarker } from "@/components/delivery/delivery-map";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeliveryTrail, useLiveDeliveries } from "@/hooks/use-delivery";
import { cn } from "@/lib/utils";

export function LiveMapPanel({ branchId }: { branchId: string | null }) {
  const live = useLiveDeliveries(branchId, true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const trail = useDeliveryTrail(branchId, selectedId);
  const branch = live.data?.branch;

  const markers = useMemo(() => {
    const list: MapMarker[] = [];
    if (branch?.lat != null && branch?.lng != null) {
      list.push({
        id: "branch",
        lat: branch.lat,
        lng: branch.lng,
        label: "Branch",
        tone: "branch",
      });
    }
    for (const d of live.data?.deliveries ?? []) {
      if (d.driverLat == null || d.driverLng == null) continue;
      list.push({
        id: d.id,
        lat: Number(d.driverLat),
        lng: Number(d.driverLng),
        label: `#${d.orderNumber}${d.staleGps ? " · stale GPS" : ""}`,
        tone: d.staleGps ? "stale" : "driver",
      });
    }
    return list;
  }, [branch?.lat, branch?.lng, live.data?.deliveries]);

  const path = useMemo(
    () => (trail.data?.pings ?? []).map((p) => ({ lat: p.lat, lng: p.lng })),
    [trail.data?.pings],
  );

  if (live.isLoading) return <Skeleton className="h-80 w-full" />;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="overflow-hidden p-2">
        <DeliveryMap
          markers={markers}
          path={selectedId ? path : undefined}
          radiusMeters={
            branch?.lat != null && branch.radiusKm > 0 ? branch.radiusKm * 1000 : null
          }
          className="h-[420px] w-full rounded-md"
        />
        <p className="px-2 py-1 text-[11px] text-muted-foreground">
          Live positions refresh every 10s. Select a delivery to replay its trail.
          {branch?.lat == null
            ? " Set branch coordinates under Tracking settings to show the geofence circle."
            : ` Geofence ${branch.radiusKm} km · stale after ${branch.staleMinutes} min.`}
        </p>
      </Card>
      <Card className="flex max-h-[460px] flex-col divide-y divide-border overflow-auto p-2">
        {(live.data?.deliveries ?? []).length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No open deliveries with assigned drivers.</p>
        ) : (
          (live.data?.deliveries ?? []).map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedId(d.id === selectedId ? null : d.id)}
              className={cn(
                "flex flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-secondary/60",
                selectedId === d.id && "bg-secondary",
              )}
            >
              <span className="font-medium text-foreground">
                #{d.orderNumber} · {d.guestName ?? "Guest"}
              </span>
              <span className="text-xs text-muted-foreground">
                {d.driver?.name ?? "No driver"} · {d.deliveryStatus}
                {d.staleGps ? " · stale GPS" : ""}
              </span>
              {d.lastEvent ? (
                <span className="text-[11px] text-muted-foreground">
                  Last: {d.lastEvent.type.replaceAll("_", " ").toLowerCase()}
                </span>
              ) : null}
            </button>
          ))
        )}
      </Card>
    </div>
  );
}
