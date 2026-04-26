"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  lat: number;
  lng: number;
  onChange: (point: { lat: number; lng: number }) => void;
  height?: string;
}

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#0f172a;border:3px solid white;box-shadow:0 2px 8px rgba(15,23,42,.35)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function ContainerLocationPickerClient({
  lat,
  lng,
  onChange,
  height = "280px",
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    const map = L.map(divRef.current, { zoomControl: true, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    map.setView([lat, lng], 14);
    markerRef.current = L.marker([lat, lng], { icon: markerIcon, draggable: true }).addTo(map);
    markerRef.current.on("dragend", () => {
      const point = markerRef.current?.getLatLng();
      if (point) onChangeRef.current({ lat: point.lat, lng: point.lng });
    });
    map.on("click", (event: L.LeafletMouseEvent) => {
      onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    });
    setTimeout(() => map.invalidateSize(), 0);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const next = L.latLng(lat, lng);
    marker.setLatLng(next);
    if (!map.getBounds().pad(-0.2).contains(next)) {
      map.panTo(next);
    }
  }, [lat, lng]);

  return <div ref={divRef} style={{ width: "100%", height }} />;
}
