"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  MapPin,
  Navigation,
  PlayCircle,
  StopCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useCrewLocationTracking } from "@/hooks/use-crew-location";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { usePolling } from "@/hooks/use-polling";
import { getCrews, getRoutePlan } from "@/lib/api/client";
import { formatApiDistanceToNow } from "@/lib/dates";

const DEMO_CREW_ID = "crew-alpha";

export default function CrewHomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [crewId] = useState(DEMO_CREW_ID);

  const fetchCrews = useCallback(() => getCrews(), []);
  const { data: crews } = usePolling(fetchCrews, 30_000);

  const crew = crews?.find((c) => c.crew_id === crewId) ?? crews?.[0] ?? null;
  const routePlanId = crew?.assigned_route_plan_id;

  const fetchRoute = useCallback(
    () => routePlanId ? getRoutePlan(routePlanId) : Promise.resolve(null),
    [routePlanId]
  );
  const { data: routePlan } = usePolling(fetchRoute, 30_000, !!routePlanId);

  const myRoute = routePlan?.routes.find((r) => r.crew_id === crewId) ?? routePlan?.routes[0] ?? null;
  const allStops = myRoute?.stops ?? [];
  const completed = allStops.filter((s) => s.status === "COMPLETED").length;
  const remaining = allStops.filter((s) => s.status === "PENDING" || s.status === "ARRIVED").length;
  const nextStop = allStops.find((s) => s.status === "PENDING" || s.status === "ARRIVED" || s.status === "IN_PROGRESS");

  const { isTracking, permissionState, lastPosition, lastSentAt, error, startTracking, stopTracking } =
    useCrewLocationTracking(crewId, routePlanId);

  useEffect(() => {
    if (crew?.status !== "OFF_DUTY" && !isTracking) {
      startTracking();
    }
  }, [crew?.status, isTracking, startTracking]);

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Greeting */}
      <div className="pt-2">
        <h1 className="text-xl font-bold">Good {getTimeOfDay()}, {user?.name?.split(" ")[0] ?? "Crew"}</h1>
        {crew && <p className="text-sm text-muted-foreground">{crew.name} · {crew.vehicle_id}</p>}
      </div>

      {/* GPS status */}
      <Card className={isTracking ? "border-green-500/30 bg-green-50/30 dark:bg-green-900/10" : "border-yellow-500/30 bg-yellow-50/30 dark:bg-yellow-900/10"}>
        <CardContent className="p-3 flex items-center gap-3">
          {isTracking ? (
            <Wifi className="h-5 w-5 text-green-600 shrink-0" />
          ) : (
            <WifiOff className="h-5 w-5 text-yellow-600 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            {isTracking ? (
              <>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">GPS Active</p>
                {lastSentAt && (
                  <p className="text-xs text-muted-foreground">
                    Last sent {formatApiDistanceToNow(lastSentAt)}
                  </p>
                )}
                {lastPosition && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {lastPosition.lat.toFixed(4)}, {lastPosition.lng.toFixed(4)}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  {permissionState === "denied" ? "GPS Permission Denied" : "GPS Inactive"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {error ?? "Tap to enable location sharing with dispatch"}
                </p>
              </>
            )}
          </div>
          {!isTracking && permissionState !== "denied" && (
            <Button size="sm" onClick={startTracking} className="shrink-0">Enable</Button>
          )}
          {isTracking && (
            <Button size="sm" variant="outline" onClick={stopTracking} className="shrink-0">Stop</Button>
          )}
        </CardContent>
      </Card>

      {/* Route summary */}
      {routePlan ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today&apos;s Route — {routePlan.date}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted rounded-lg p-2">
                <p className="text-xl font-bold">{allStops.length}</p>
                <p className="text-xs text-muted-foreground">Stops</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-2">
                <p className="text-xl font-bold text-green-700 dark:text-green-400">{completed}</p>
                <p className="text-xs text-muted-foreground">Done</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-lg p-2">
                <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{remaining}</p>
                <p className="text-xs text-muted-foreground">Left</p>
              </div>
            </div>

            {allStops.length > 0 && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{completed}/{allStops.length}</span>
                </div>
                <Progress value={allStops.length > 0 ? (completed / allStops.length) * 100 : 0} className="h-2" />
              </div>
            )}

            {nextStop && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Next stop</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{nextStop.container_name ?? nextStop.container_id}</p>
                      <p className="text-xs text-muted-foreground">{nextStop.address}</p>
                      <p className="text-xs text-muted-foreground">
                        Reasons: {nextStop.reason.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">No route assigned today</p>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="h-14 flex-col gap-1"
          onClick={() => router.push("/crew/route")}
        >
          <Navigation className="h-5 w-5" />
          <span className="text-xs">Open Route</span>
        </Button>
        <Button
          variant="outline"
          className="h-14 flex-col gap-1"
          onClick={() => router.push("/crew/stops")}
        >
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs">View Stops</span>
        </Button>
        {crew?.status === "OFF_DUTY" ? (
          <Button variant="secondary" className="h-14 flex-col gap-1 col-span-2">
            <PlayCircle className="h-5 w-5 text-green-600" />
            <span className="text-xs">Start Shift</span>
          </Button>
        ) : (
          <Button variant="secondary" className="h-14 flex-col gap-1 col-span-2">
            <StopCircle className="h-5 w-5 text-red-600" />
            <span className="text-xs">End Shift</span>
          </Button>
        )}
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
