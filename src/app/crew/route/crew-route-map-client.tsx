"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RouteStop } from "@/types";
import { CrewLocation } from "@/types";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#9ca3af",
  ARRIVED: "#3b82f6",
  IN_PROGRESS: "#eab308",
  COMPLETED: "#22c55e",
  SKIPPED: "#f97316",
  FAILED: "#ef4444",
};

interface Props {
  stops: RouteStop[];
  crewLocation: CrewLocation | null;
}

export default function CrewRouteMapClient({ stops, crewLocation }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const lgRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    const map = L.map(divRef.current, { zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;
    lgRef.current = L.layerGroup().addTo(map);
    map.setView([44.8178, 20.4569], 13);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const lg = lgRef.current;
    if (!map || !lg) return;
    lg.clearLayers();

    const latlngs: [number, number][] = [];

    stops.forEach((stop) => {
      const color = STATUS_COLOR[stop.status] ?? "#9ca3af";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;color:white;">${stop.order}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const m = L.marker([stop.location.lat, stop.location.lng], { icon });
      m.bindPopup(`<b>${stop.container_name ?? stop.container_id}</b><br>${stop.address ?? ""}<br>Fill: ${stop.fill_pct ?? "?"}%`);
      lg.addLayer(m);
      latlngs.push([stop.location.lat, stop.location.lng]);
    });

    if (latlngs.length > 1) {
      L.polyline(latlngs, { color: "#3b82f6", weight: 3, dashArray: "6 4" }).addTo(lg);
    }

    if (crewLocation) {
      const crewIcon = L.divIcon({
        className: "",
        html: `<div style="width:24px;height:24px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #2563eb;"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([crewLocation.lat, crewLocation.lng], { icon: crewIcon })
        .bindPopup("Your location")
        .addTo(lg);
    }

    if (latlngs.length > 0) {
      map.fitBounds(L.latLngBounds(latlngs).pad(0.15));
    }
  }, [stops, crewLocation]);

  return <div ref={divRef} style={{ width: "100%", height: "100%", minHeight: 320 }} />;
}
