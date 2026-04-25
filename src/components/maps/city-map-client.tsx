"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Container, CleaningCrew } from "@/types";

// Fix default marker icons
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function getFillColor(fillState?: string, deviceStatus?: string, flameDetected?: boolean): string {
  if (flameDetected) return "#f97316";
  if (deviceStatus === "OFFLINE") return "#6b7280";
  if (deviceStatus === "FAULT") return "#ef4444";
  switch (fillState) {
    case "CRITICAL": return "#ef4444";
    case "FULL": return "#f97316";
    case "NEAR_FULL": return "#eab308";
    case "NORMAL": return "#22c55e";
    case "EMPTY": return "#9ca3af";
    default: return "#6b7280";
  }
}

function makeContainerIcon(container: Container): L.DivIcon {
  const color = getFillColor(
    container.latest_state.fill_state,
    container.latest_state.device_status,
    container.latest_state.flame_detected
  );
  const fill = container.latest_state.fused_fill_pct ?? 0;
  const garbageDot = container.latest_state.camera_state === "GARBAGE_DETECTED"
    ? `<div style="position:absolute;top:-3px;right:-3px;width:8px;height:8px;background:#a21caf;border-radius:50%;border:1px solid white;"></div>`
    : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:28px;height:28px;">
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="14" y="18" text-anchor="middle" font-size="9" font-weight="bold" fill="white">${Math.round(fill)}%</text>
      </svg>
      ${garbageDot}
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function makeCrewIcon(_crew: CleaningCrew): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;background:#2563eb;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;color:white;">🚛</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

interface Props {
  containers: Container[];
  crews: CleaningCrew[];
  onContainerClick?: (container: Container) => void;
  height?: string;
}

export default function CityMapClient({ containers, crews, onContainerClick, height = "100%" }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    const map = L.map(divRef.current, { zoomControl: true, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    // Set initial view to Belgrade
    map.setView([44.8178, 20.4569], 13);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update container markers
  useEffect(() => {
    const map = mapRef.current;
    const lg = markersRef.current;
    if (!map || !lg) return;
    lg.clearLayers();

    containers.forEach((container) => {
      if (!container.location) return;
      const [lng, lat] = container.location.coordinates;
      const icon = makeContainerIcon(container);
      const marker = L.marker([lat, lng], { icon });
      const fill = container.latest_state.fused_fill_pct?.toFixed(0) ?? "?";
      const state = container.latest_state.fill_state ?? "UNKNOWN";
      const lastSeen = container.latest_state.last_seen_at
        ? new Date(container.latest_state.last_seen_at).toLocaleTimeString()
        : "never";
      marker.bindPopup(
        `<div style="min-width:180px">
          <div style="font-weight:600;margin-bottom:4px">${container.name}</div>
          <div style="font-size:12px;color:#666">${container.address ?? ""}</div>
          <div style="margin-top:6px;font-size:12px">Fill: <b>${fill}%</b> — ${state}</div>
          <div style="font-size:12px">Camera: ${container.latest_state.camera_state ?? "?"}</div>
          <div style="font-size:12px">Device: ${container.latest_state.device_status ?? "?"}</div>
          <div style="font-size:11px;color:#999;margin-top:4px">Last seen: ${lastSeen}</div>
          <div style="margin-top:8px">
            <a href="/dashboard/containers/${container.container_id}" style="color:#2563eb;font-size:12px">View details →</a>
          </div>
        </div>`,
        { maxWidth: 220 }
      );
      if (onContainerClick) {
        marker.on("click", () => onContainerClick(container));
      }
      lg.addLayer(marker);
    });

    // Crew markers
    crews.forEach((crew) => {
      if (!crew.current_location) return;
      const { lat, lng } = crew.current_location;
      const icon = makeCrewIcon(crew);
      const marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 });
      marker.bindPopup(
        `<div style="min-width:160px">
          <div style="font-weight:600">${crew.name}</div>
          <div style="font-size:12px">${crew.vehicle_id ?? "No vehicle"}</div>
          <div style="font-size:12px">Status: ${crew.status}</div>
        </div>`
      );
      lg.addLayer(marker);
    });
  }, [containers, crews, onContainerClick]);

  return <div ref={divRef} style={{ width: "100%", height }} />;
}
