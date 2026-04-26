"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CleaningCrew, Container } from "@/types";
import { formatApiDateTime } from "@/lib/dates";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function getFillColor(fillState?: string, deviceStatus?: string, flameDetected?: boolean): string {
  if (flameDetected) return "#f97316";
  if (deviceStatus === "OFFLINE") return "#64748b";
  if (deviceStatus === "FAULT") return "#ef4444";
  switch (fillState) {
    case "CRITICAL":
      return "#dc2626";
    case "FULL":
      return "#f97316";
    case "NEAR_FULL":
      return "#eab308";
    case "NORMAL":
      return "#16a34a";
    case "EMPTY":
      return "#94a3b8";
    default:
      return "#64748b";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusLabel(value?: string): string {
  return value ? value.replace(/_/g, " ") : "UNKNOWN";
}

function formatMaybeNumber(value: number | undefined, suffix = ""): string {
  return typeof value === "number" ? `${value.toFixed(0)}${suffix}` : "-";
}

function makeContainerIcon(container: Container): L.DivIcon {
  const color = getFillColor(
    container.latest_state.fill_state,
    container.latest_state.device_status,
    container.latest_state.flame_detected
  );
  const fill = container.latest_state.fused_fill_pct ?? 0;
  const garbageDot =
    container.latest_state.camera_state === "GARBAGE_DETECTED"
      ? `<div style="position:absolute;top:-4px;right:-4px;width:10px;height:10px;background:#a21caf;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(162,28,175,.4)"></div>`
      : "";

  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:34px;height:34px">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};box-shadow:0 10px 22px rgba(15,23,42,.22);border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:800">${Math.round(fill)}%</div>
      ${garbageDot}
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

function makeCrewIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;background:#2563eb;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 22px rgba(37,99,235,.32)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 17h4V5H2v12h3" />
        <path d="M14 17h1m4 0h3v-6l-3-4h-5" />
        <circle cx="7.5" cy="17.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function containerPopup(container: Container): string {
  const color = getFillColor(
    container.latest_state.fill_state,
    container.latest_state.device_status,
    container.latest_state.flame_detected
  );
  const fillValue = container.latest_state.fused_fill_pct;
  const fill = typeof fillValue === "number" ? fillValue.toFixed(0) : "?";
  const fillBar = Math.max(0, Math.min(100, fillValue ?? 0));
  const lastSeen = container.latest_state.last_seen_at
    ? formatApiDateTime(container.latest_state.last_seen_at)
    : "Never";

  return `<div style="width:250px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px">
      <div>
        <div style="font-size:14px;font-weight:800;line-height:1.25">${escapeHtml(container.name)}</div>
        <div style="font-size:11px;color:#64748b;margin-top:3px">${escapeHtml(container.address ?? "No address recorded")}</div>
      </div>
      <div style="height:38px;width:38px;border-radius:10px;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;box-shadow:0 8px 18px rgba(15,23,42,.16)">${fill}%</div>
    </div>
    <div style="height:8px;border-radius:999px;background:#e2e8f0;overflow:hidden;margin-bottom:12px">
      <div style="height:100%;width:${fillBar}%;background:${color};border-radius:999px"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:7px 8px">
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Fill state</div>
        <div style="font-size:12px;font-weight:800;margin-top:2px">${statusLabel(container.latest_state.fill_state)}</div>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:7px 8px">
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Device</div>
        <div style="font-size:12px;font-weight:800;margin-top:2px">${statusLabel(container.latest_state.device_status)}</div>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:7px 8px">
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Camera</div>
        <div style="font-size:12px;font-weight:800;margin-top:2px">${statusLabel(container.latest_state.camera_state)}</div>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:7px 8px">
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Weight</div>
        <div style="font-size:12px;font-weight:800;margin-top:2px">${formatMaybeNumber(container.latest_state.weight_kg, " kg")}</div>
      </div>
    </div>
    <div style="font-size:11px;color:#64748b;margin-bottom:10px">Last seen: ${escapeHtml(lastSeen)}</div>
    <a href="/dashboard/containers/${escapeHtml(container.container_id)}" style="display:flex;align-items:center;justify-content:center;border-radius:8px;background:#0f172a;color:white;text-decoration:none;font-size:12px;font-weight:800;padding:8px 10px">
      View container details
    </a>
  </div>`;
}

function crewPopup(crew: CleaningCrew): string {
  const updatedAt = crew.current_location?.updated_at
    ? formatApiDateTime(crew.current_location.updated_at)
    : "Never";

  return `<div style="width:215px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a">
    <div style="font-size:14px;font-weight:800;line-height:1.25">${escapeHtml(crew.name)}</div>
    <div style="font-size:11px;color:#64748b;margin-top:3px">${escapeHtml(crew.vehicle_id ?? "No vehicle assigned")}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:7px 8px">
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Status</div>
        <div style="font-size:12px;font-weight:800;margin-top:2px">${statusLabel(crew.status)}</div>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:7px 8px">
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Members</div>
        <div style="font-size:12px;font-weight:800;margin-top:2px">${crew.members_count}</div>
      </div>
    </div>
    <div style="font-size:11px;color:#64748b;margin-top:10px">Updated: ${escapeHtml(updatedAt)}</div>
  </div>`;
}

interface Props {
  containers: Container[];
  crews: CleaningCrew[];
  onContainerClick?: (container: Container) => void;
  height?: string;
}

export default function CityMapClient({
  containers,
  crews,
  onContainerClick,
  height = "100%",
}: Props) {
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
    map.setView([44.8178, 20.4569], 13);
    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markersRef.current;
    if (!map || !markerLayer) return;
    markerLayer.clearLayers();

    containers.forEach((container) => {
      if (!container.location) return;
      const [lng, lat] = container.location.coordinates;
      const marker = L.marker([lat, lng], { icon: makeContainerIcon(container) });
      marker.bindPopup(containerPopup(container), {
        maxWidth: 285,
        className: "operations-popup",
      });
      if (onContainerClick) {
        marker.on("click", () => onContainerClick(container));
      }
      markerLayer.addLayer(marker);
    });

    crews.forEach((crew) => {
      if (!crew.current_location) return;
      const { lat, lng } = crew.current_location;
      const marker = L.marker([lat, lng], { icon: makeCrewIcon(), zIndexOffset: 1000 });
      marker.bindPopup(crewPopup(crew), {
        maxWidth: 250,
        className: "operations-popup",
      });
      markerLayer.addLayer(marker);
    });
  }, [containers, crews, onContainerClick]);

  return <div ref={divRef} style={{ width: "100%", height }} />;
}
