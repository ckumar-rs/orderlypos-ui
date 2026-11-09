"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DeliveryMap } from "@/components/delivery/delivery-map";
import { DeliveryTrackingSettings } from "@/components/delivery/delivery-tracking-settings";
import { LiveMapPanel } from "@/components/delivery/live-map-panel";
import { FoodPlatformBadge } from "@/components/orders/channel-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { useCurrentUser } from "@/hooks/use-auth";
import {
  useDeliveries,
  useDeliveryActions,
  useDeliveryTrail,
  useDrivers,
  useZoneActions,
  useZones,
  type DeliveryOrder,
  type DeliveryStatus,
} from "@/hooks/use-delivery";
import { useSettings } from "@/hooks/use-settings";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  UNASSIGNED: "Needs driver",
  ASSIGNED: "Driver assigned",
  PICKED_UP: "Out for delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
};

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

function DeliveryCard({ order, branchId }: { order: DeliveryOrder; branchId: string | null }) {
  const { data: drivers } = useDrivers(branchId);
  const { assign, setStatus, shareLocation } = useDeliveryActions(branchId);
  const me = useCurrentUser();
  const [showReplay, setShowReplay] = useState(false);
  const trail = useDeliveryTrail(branchId, showReplay ? order.id : null);
  const status = order.deliveryStatus ?? "UNASSIGNED";
  const move = (next: DeliveryStatus) =>
    setStatus.mutate({ orderId: order.id, status: next }, { onError: (e) => toast.error(errMsg(e)) });
  const replayPath = useMemo(
    () => (trail.data?.pings ?? []).map((p) => ({ lat: p.lat, lng: p.lng })),
    [trail.data?.pings],
  );
  const replayMarkers = useMemo(() => {
    const markers = [];
    const b = trail.data?.branch;
    if (b?.lat != null && b?.lng != null) {
      markers.push({ id: "branch", lat: b.lat, lng: b.lng, label: "Branch", tone: "branch" as const });
    }
    const last = trail.data?.pings?.at(-1);
    if (last) {
      markers.push({
        id: "driver",
        lat: last.lat,
        lng: last.lng,
        label: "Latest ping",
        tone: "driver" as const,
      });
    }
    return markers;
  }, [trail.data]);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              #{order.orderNumber} · {order.guestName ?? "Guest"}
            </p>
            <FoodPlatformBadge platform={order.foodPlatform} externalOrderId={order.externalOrderId} />
          </div>
          <p className="text-xs text-muted-foreground">
            {order.deliveryAddress ?? "Address in notes"}
            {order.deliveryPincode && ` · ${order.deliveryPincode}`}
          </p>
          {order.deliveryPhone && order.deliveryPhone !== "Not shared" ? (
            <a href={`tel:${order.deliveryPhone}`} className="text-xs text-primary underline underline-offset-2">
              {order.deliveryPhone}
            </a>
          ) : order.deliveryPhone === "Not shared" ? (
            <p className="text-xs text-muted-foreground">Phone not shared</p>
          ) : null}
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
          {STATUS_LABEL[status]}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {formatCurrency(order.totalAmount)} + {formatCurrency(order.deliveryFee)} delivery
        {order.deliveryZone && ` · ${order.deliveryZone.name}`}
        {order.deliveryEtaAt && ` · ETA ${time(order.deliveryEtaAt)}`}
        {order.scheduledFor && ` · scheduled ${time(order.scheduledFor)}`}
      </p>
      {order.notes && <p className="text-xs italic text-muted-foreground">{order.notes}</p>}
      {order.driverLat && order.driverLng && !showReplay && (
        <div className="overflow-hidden rounded-lg border border-border">
          <DeliveryMap
            markers={[
              {
                id: order.id,
                lat: Number(order.driverLat),
                lng: Number(order.driverLng),
                label: `#${order.orderNumber}`,
                tone: "driver",
              },
            ]}
            className="h-40 w-full"
          />
          <p className="px-2 py-1 text-[11px] text-muted-foreground">
            Driver shared this device&apos;s location
            {order.driverLocationAt ? ` at ${time(order.driverLocationAt)}` : ""}.
          </p>
        </div>
      )}
      {showReplay && (
        <div className="overflow-hidden rounded-lg border border-border">
          {trail.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <DeliveryMap
              markers={replayMarkers}
              path={replayPath}
              radiusMeters={
                trail.data?.branch?.lat != null && (trail.data.branch.radiusKm ?? 0) > 0
                  ? trail.data.branch.radiusKm * 1000
                  : null
              }
              className="h-48 w-full"
            />
          )}
          <p className="px-2 py-1 text-[11px] text-muted-foreground">
            Route replay · {trail.data?.pings.length ?? 0} pings
            {trail.data?.trackingToken ? (
              <>
                {" "}
                · guest link{" "}
                <a className="underline" href={`/track/${trail.data.trackingToken}`} target="_blank" rel="noreferrer">
                  /track/…
                </a>
              </>
            ) : null}
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setShowReplay((v) => !v)}>
          {showReplay ? "Hide route" : "Replay route"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {["RAPIDO", "DUNZO", "SHADOWFAX"].map((provider) => (
          <Button
            key={provider}
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              api
                .post(`/commerce/fleet/${provider}/dispatch?branchId=${branchId}`, { orderId: order.id })
                .then(() => toast.success(`${provider} dispatch requested`))
                .catch((e) => toast.error(errMsg(e)))
            }
          >
            Dispatch {provider}
          </Button>
        ))}
      </div>
      {(status === "ASSIGNED" || status === "PICKED_UP") &&
        (order.driver?.id === me.data?.user.id || me.data?.user.permissions.includes("delivery.manage")) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={shareLocation.isPending}
            onClick={() => {
              if (!navigator.geolocation) {
                toast.error("This device cannot share a location.");
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  shareLocation.mutate(
                    { orderId: order.id, lat: position.coords.latitude, lng: position.coords.longitude },
                    {
                      onSuccess: () => toast.success("Location shared from this device"),
                      onError: (e) => toast.error(errMsg(e)),
                    },
                  );
                },
                () => toast.error("Location permission was not granted"),
              );
            }}
          >
            Share this device's location
          </Button>
        )}
      <div className="flex flex-wrap items-center gap-2">
        {(status === "UNASSIGNED" || status === "ASSIGNED") && (
          <select
            aria-label="Driver"
            value={order.driver?.id ?? ""}
            onChange={(e) =>
              e.target.value &&
              assign.mutate(
                { orderId: order.id, driverId: e.target.value },
                { onError: (err) => toast.error(errMsg(err)) },
              )
            }
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Assign driver…</option>
            {drivers?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
        {status === "PICKED_UP" && order.driver && (
          <span className="text-xs text-muted-foreground">Driver: {order.driver.name}</span>
        )}
        {status === "ASSIGNED" && <Button size="sm" onClick={() => move("PICKED_UP")}>Picked up</Button>}
        {status === "PICKED_UP" && <Button size="sm" onClick={() => move("DELIVERED")}>Delivered</Button>}
        {status !== "DELIVERED" && status !== "FAILED" && (
          <Button size="sm" variant="outline" onClick={() => move("FAILED")}>
            Mark failed
          </Button>
        )}
      </div>
    </Card>
  );
}

function ZonesTab({ branchId }: { branchId: string | null }) {
  const { data: zones, isLoading } = useZones(branchId);
  const { create, remove, update } = useZoneActions(branchId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", fee: "40", minOrderAmount: "0", etaMinutes: "45", pincodes: "" });

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", fee: "40", minOrderAmount: "0", etaMinutes: "45", pincodes: "" });
  };

  const submit = () => {
    const pincodes = form.pincodes.split(/[\s,]+/).filter(Boolean);
    if (!form.name.trim() || pincodes.length === 0) return toast.error("Enter a name and at least one pincode");
    const dto = {
      name: form.name.trim(),
      fee: form.fee,
      minOrderAmount: form.minOrderAmount,
      etaMinutes: Number(form.etaMinutes),
      pincodes,
      isActive: true,
    };
    if (editingId) {
      update.mutate(
        { id: editingId, dto },
        {
          onSuccess: () => {
            toast.success("Zone updated");
            resetForm();
          },
          onError: (e) => toast.error(errMsg(e)),
        },
      );
      return;
    }
    create.mutate(dto, {
      onSuccess: () => {
        toast.success("Zone added");
        resetForm();
      },
      onError: (e) => toast.error(errMsg(e)),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input placeholder="Zone name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Fee" inputMode="decimal" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
        <Input placeholder="Min order" inputMode="decimal" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
        <Input placeholder="ETA (min)" inputMode="numeric" value={form.etaMinutes} onChange={(e) => setForm({ ...form, etaMinutes: e.target.value })} />
        <Input placeholder="Pincodes, comma separated" value={form.pincodes} onChange={(e) => setForm({ ...form, pincodes: e.target.value })} />
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-5">
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {editingId ? "Save zone" : "Add zone"}
          </Button>
          <p className="mt-2 w-full text-xs text-muted-foreground">
            Until you add a zone, delivery orders are accepted from anywhere with no fee. Once a zone exists, only
            its pincodes can order delivery.
          </p>
        </div>
      </Card>
      <Card className="flex flex-col divide-y divide-border p-2">
        {isLoading ? (
          <Skeleton className="m-4 h-12" />
        ) : zones && zones.length > 0 ? (
          zones.map((z) => (
            <div key={z.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className={cn("font-medium", !z.isActive && "text-muted-foreground line-through")}>{z.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(z.fee)} fee · min {formatCurrency(z.minOrderAmount)} · {z.etaMinutes} min ·{" "}
                  {z.pincodes.join(", ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(z.id);
                    setForm({
                      name: z.name,
                      fee: String(z.fee),
                      minOrderAmount: String(z.minOrderAmount),
                      etaMinutes: String(z.etaMinutes),
                      pincodes: z.pincodes.join(", "),
                    });
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => update.mutate({ id: z.id, dto: { isActive: !z.isActive } }, { onError: (e) => toast.error(errMsg(e)) })}
                >
                  {z.isActive ? "Disable" : "Enable"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => confirm(`Delete zone ${z.name}?`) && remove.mutate(z.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">No delivery zones yet.</p>
        )}
      </Card>
    </div>
  );
}

export default function DeliveryPage() {
  const { branchId } = useBranch();
  const [tab, setTab] = useState<"live" | "active" | "history" | "zones" | "tracking">("live");
  const { data: orders, isLoading } = useDeliveries(
    branchId,
    tab === "history",
  );
  const settings = useSettings(branchId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Delivery</h1>
        <p className="text-sm text-muted-foreground">
          Live map, assign drivers, replay routes, and manage zones
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["live", "active", "history", "zones", "tracking"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3.5 py-1 text-xs capitalize transition-colors",
              tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "live" ? (
        <LiveMapPanel branchId={branchId} />
      ) : tab === "tracking" ? (
        settings.data?.branch ? (
          <DeliveryTrackingSettings branchId={branchId} branch={settings.data.branch} />
        ) : (
          <Skeleton className="h-40 w-full max-w-xl" />
        )
      ) : tab === "zones" ? (
        <ZonesTab branchId={branchId} />
      ) : isLoading ? (
        <Skeleton className="h-24" />
      ) : orders && orders.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((o) => (
            <DeliveryCard key={o.id} order={o} branchId={branchId} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {tab === "active" ? "No active deliveries." : "No completed deliveries yet."}
        </Card>
      )}
    </div>
  );
}
