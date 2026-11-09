"use client";

import { useEffect, useId, useRef } from "react";
import type { LatLngExpression } from "leaflet";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  tone?: "driver" | "branch" | "stale";
};

export type MapPath = { lat: number; lng: number }[];

/** Lightweight Leaflet map for live drivers and route replay (OSM tiles). */
export function DeliveryMap({
  markers,
  path,
  radiusMeters,
  className,
}: {
  markers: MapMarker[];
  path?: MapPath;
  /** Optional circle around the first branch marker. */
  radiusMeters?: number | null;
  className?: string;
}) {
  const hostId = useId().replace(/:/g, "");
  const mapRef = useRef<import("leaflet").Map | null>(null);

  const markersKey = JSON.stringify(markers);
  const pathKey = JSON.stringify(path ?? []);

  useEffect(() => {
    let cancelled = false;
    const markerList = JSON.parse(markersKey) as MapMarker[];
    const pathList = JSON.parse(pathKey) as MapPath;
    void (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled) return;
      const el = document.getElementById(hostId);
      if (!el) return;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      const points: LatLngExpression[] = [
        ...markerList.map((m) => [m.lat, m.lng] as LatLngExpression),
        ...pathList.map((p) => [p.lat, p.lng] as LatLngExpression),
      ];
      const center =
        points[0] ??
        ([20.5937, 78.9629] as LatLngExpression);
      const map = L.map(el, { zoomControl: true }).setView(center, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const branch = markerList.find((m) => m.tone === "branch");
      if (branch && radiusMeters && radiusMeters > 0) {
        L.circle([branch.lat, branch.lng], {
          radius: radiusMeters,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(map);
      }

      for (const marker of markerList) {
        const color =
          marker.tone === "branch"
            ? "#1d4ed8"
            : marker.tone === "stale"
              ? "#b45309"
              : "#15803d";
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:12px;height:12px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        const m = L.marker([marker.lat, marker.lng], { icon }).addTo(map);
        if (marker.label) m.bindPopup(marker.label);
      }

      if (pathList.length >= 2) {
        L.polyline(
          pathList.map((p) => [p.lat, p.lng] as LatLngExpression),
          { color: "#0f766e", weight: 3, opacity: 0.85 },
        ).addTo(map);
      }

      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points), { padding: [28, 28] });
      }
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [hostId, markersKey, pathKey, radiusMeters]);

  return (
    <div
      id={hostId}
      className={className ?? "h-64 w-full overflow-hidden rounded-lg border border-border"}
    />
  );
}
