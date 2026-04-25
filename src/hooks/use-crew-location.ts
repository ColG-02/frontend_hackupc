"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendCrewLocation } from "@/lib/api/client";

type PermissionState = "prompt" | "granted" | "denied" | "unavailable";

interface LocationState {
  lat: number;
  lng: number;
  accuracy_m?: number;
  heading_deg?: number;
  speed_mps?: number;
  recorded_at: string;
}

export function useCrewLocationTracking(
  crewId: string | null,
  routePlanId?: string,
  updateIntervalMs = 10_000
) {
  const [isTracking, setIsTracking] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>("prompt");
  const [lastPosition, setLastPosition] = useState<LocationState | null>(null);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastSendRef = useRef<number>(0);

  const sendPosition = useCallback(
    async (pos: GeolocationPosition) => {
      if (!crewId) return;
      const now = Date.now();
      if (now - lastSendRef.current < updateIntervalMs * 0.8) return;
      lastSendRef.current = now;
      const recorded_at = new Date(pos.timestamp).toISOString();
      const payload = {
        crew_id: crewId,
        route_plan_id: routePlanId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
        heading_deg: pos.coords.heading ?? undefined,
        speed_mps: pos.coords.speed ?? undefined,
        recorded_at,
      };
      setLastPosition({
        lat: payload.lat,
        lng: payload.lng,
        accuracy_m: payload.accuracy_m,
        heading_deg: payload.heading_deg,
        speed_mps: payload.speed_mps,
        recorded_at,
      });
      try {
        await sendCrewLocation(payload);
        setLastSentAt(recorded_at);
      } catch {
        // swallow — position is still stored locally
      }
    },
    [crewId, routePlanId, updateIntervalMs]
  );

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionState("unavailable");
      setError("Geolocation is not supported by this browser.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPermissionState("granted");
        setIsTracking(true);
        setError(null);
        sendPosition(pos);
      },
      (err) => {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setPermissionState("denied");
          setError("Location permission denied.");
        } else {
          setError(err.message);
        }
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    setIsTracking(true);
  }, [sendPosition]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    permissionState,
    lastPosition,
    lastSentAt,
    error,
    startTracking,
    stopTracking,
  };
}
