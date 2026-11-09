"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DeliveryMap } from "@/components/delivery/delivery-map";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type TrackPayload = {
  orderNumber: string;
  status: string | null;
  driverLat: number | null;
  driverLng: number | null;
  driverLocationAt: string | null;
  branch: { lat: number | null; lng: number | null; radiusKm: number };
  pings: Array<{ lat: number; lng: number; recordedAt: string }>;
};

export default function PublicTrackPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const track = useQuery({
    queryKey: ["public-track", token],
    queryFn: async () => {
      const res = await fetch(`/api/v1/public/track/${token}`, { credentials: "omit" });
      if (!res.ok) throw new Error("Tracking link not found");
      return (await res.json()) as TrackPayload;
    },
    enabled: Boolean(token),
    refetchInterval: 12_000,
  });

  const markers = useMemo(() => {
    const list = [];
    const b = track.data?.branch;
    if (b?.lat != null && b?.lng != null) {
      list.push({ id: "branch", lat: b.lat, lng: b.lng, label: "Restaurant", tone: "branch" as const });
    }
    const last = track.data?.pings?.at(-1);
    const lat = track.data?.driverLat ?? last?.lat;
    const lng = track.data?.driverLng ?? last?.lng;
    if (lat != null && lng != null) {
      list.push({ id: "driver", lat, lng, label: "Driver", tone: "driver" as const });
    }
    return list;
  }, [track.data]);

  const path = useMemo(
    () => (track.data?.pings ?? []).map((p) => ({ lat: p.lat, lng: p.lng })),
    [track.data?.pings],
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 bg-background px-4 py-8 text-foreground">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Track your order</h1>
        <p className="text-sm text-muted-foreground">Live driver location and the route so far.</p>
      </div>
      {track.isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : track.isError || !track.data ? (
        <Card className="p-6 text-sm text-muted-foreground">This tracking link is not valid.</Card>
      ) : (
        <>
          <Card className="flex flex-col gap-1 p-4 text-sm">
            <p className="font-medium">Order #{track.data.orderNumber}</p>
            <p className="text-muted-foreground">
              Status: {(track.data.status ?? "—").replaceAll("_", " ").toLowerCase()}
              {track.data.driverLocationAt
                ? ` · updated ${new Date(track.data.driverLocationAt).toLocaleTimeString()}`
                : ""}
            </p>
          </Card>
          <Card className="overflow-hidden p-2">
            <DeliveryMap
              markers={markers}
              path={path}
              radiusMeters={
                track.data.branch.lat != null && track.data.branch.radiusKm > 0
                  ? track.data.branch.radiusKm * 1000
                  : null
              }
              className="h-[420px] w-full rounded-md"
            />
            <p className="px-2 py-1 text-[11px] text-muted-foreground">
              Map refreshes automatically. {track.data.pings.length} location point
              {track.data.pings.length === 1 ? "" : "s"} recorded.
            </p>
          </Card>
        </>
      )}
    </main>
  );
}
