"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolling } from "@/hooks/use-polling";
import { getCrews, getRoutePlan } from "@/lib/api/client";
import { RouteStop } from "@/types";
import { cn } from "@/lib/utils";

const CREW_ID = "crew-alpha";

const STOP_COLOR: Record<string, string> = {
  PENDING: "bg-gray-200 text-gray-700",
  ARRIVED: "bg-blue-200 text-blue-800",
  IN_PROGRESS: "bg-yellow-200 text-yellow-800",
  COMPLETED: "bg-green-200 text-green-800",
  SKIPPED: "bg-orange-200 text-orange-800",
  FAILED: "bg-red-200 text-red-800",
};

// Dynamically import the map to avoid SSR issues
const CrewRouteMapClient = dynamic(() => import("./crew-route-map-client"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

export default function CrewRoutePage() {
  const [view, setView] = useState<"map" | "list">("map");

  const fetchCrews = useCallback(() => getCrews(), []);
  const { data: crews } = usePolling(fetchCrews, 10_000);
  const crew = crews?.find((c) => c.crew_id === CREW_ID) ?? crews?.[0];

  const fetchRoute = useCallback(
    () =>
      crew?.assigned_route_plan_id
        ? getRoutePlan(crew.assigned_route_plan_id)
        : Promise.resolve(null),
    [crew?.assigned_route_plan_id]
  );
  const { data: routePlan } = usePolling(fetchRoute, 30_000, !!crew?.assigned_route_plan_id);

  const myRoute =
    routePlan?.routes.find((r) => r.crew_id === CREW_ID) ??
    routePlan?.routes[0] ??
    null;
  const stops: RouteStop[] = myRoute?.stops ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Toggle */}
      <div className="flex gap-2 p-3 border-b">
        <Button
          size="sm"
          variant={view === "map" ? "default" : "outline"}
          onClick={() => setView("map")}
          className="flex-1"
        >
          Map
        </Button>
        <Button
          size="sm"
          variant={view === "list" ? "default" : "outline"}
          onClick={() => setView("list")}
          className="flex-1"
        >
          Stop List
        </Button>
      </div>

      {view === "map" ? (
        <div className="flex-1 relative" style={{ minHeight: 320 }}>
          <CrewRouteMapClient
            stops={stops}
            crewLocation={crew?.current_location ?? null}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {stops.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No stops on this route
            </div>
          )}
          {stops.map((stop) => (
            <Card key={stop.stop_id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    STOP_COLOR[stop.status] ?? "bg-gray-100 text-gray-600"
                  )}
                >
                  {stop.order}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {stop.container_name ?? stop.container_id}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {stop.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stop.reason.join(", ")}
                    {stop.fill_pct !== undefined && ` · ${stop.fill_pct}% full`}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full shrink-0",
                    STOP_COLOR[stop.status] ?? ""
                  )}
                >
                  {stop.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Next stop CTA */}
      {view === "map" && (() => {
        const next = stops.find(
          (s) => s.status === "PENDING" || s.status === "ARRIVED"
        );
        if (!next) return null;
        return (
          <Card className="m-3 mt-0">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs text-muted-foreground">Next Stop</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {next.container_name ?? next.container_id}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {next.address}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${next.location.lat},${next.location.lng}`,
                    "_blank"
                  )
                }
              >
                Navigate
              </Button>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
