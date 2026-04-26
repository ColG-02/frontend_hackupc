"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolling } from "@/hooks/use-polling";
import { getCrew, getRoutePlan } from "@/lib/api/client";
import { formatApiDistanceToNow } from "@/lib/dates";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  ON_DUTY: "bg-green-100 text-green-700",
  IN_ROUTE: "bg-blue-100 text-blue-700",
  AT_STOP: "bg-purple-100 text-purple-700",
  ON_BREAK: "bg-yellow-100 text-yellow-700",
  OFF_DUTY: "bg-gray-100 text-gray-500",
  UNKNOWN: "bg-gray-100 text-gray-500",
};

export default function CrewDetailPage() {
  const params = useParams<{ crewId: string }>();
  const router = useRouter();
  const crewId = params.crewId;

  const crewFetcher = useCallback(() => getCrew(crewId), [crewId]);
  const { data: crew, isLoading } = usePolling(crewFetcher, 10_000);
  const assignedRoutePlanId = crew?.assigned_route_plan_id;

  const routeFetcher = useCallback(
    () => assignedRoutePlanId ? getRoutePlan(assignedRoutePlanId) : Promise.resolve(null),
    [assignedRoutePlanId]
  );
  const { data: routePlan } = usePolling(routeFetcher, 30_000, !!assignedRoutePlanId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!crew) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Crew not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{crew.name}</h1>
          <p className="text-sm text-muted-foreground">{crew.crew_id}</p>
        </div>
        <Badge className={cn("ml-auto text-xs", STATUS_COLOR[crew.status] ?? "")} variant="secondary">
          {crew.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Crew Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{crew.members_count} member{crew.members_count !== 1 ? "s" : ""}</span>
            </div>
            {crew.vehicle_id && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono">{crew.vehicle_id}</span>
              </div>
            )}
            {crew.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{crew.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">GPS Location</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {crew.current_location ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Active</span>
                </div>
                <p className="text-muted-foreground">
                  {crew.current_location.lat.toFixed(5)}, {crew.current_location.lng.toFixed(5)}
                </p>
                <p className="text-muted-foreground">
                  Updated {formatApiDistanceToNow(crew.current_location.updated_at)}
                </p>
                {crew.current_location.accuracy_m && (
                  <p className="text-muted-foreground">±{crew.current_location.accuracy_m.toFixed(0)} m accuracy</p>
                )}
                {crew.current_location.speed_mps != null && crew.current_location.speed_mps > 0 && (
                  <p className="text-muted-foreground">
                    {(crew.current_location.speed_mps * 3.6).toFixed(0)} km/h
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>No GPS data</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {routePlan && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Assigned Route — {routePlan.date}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {routePlan.routes
              .filter((r) => r.crew_id === crewId)
              .flatMap((r) => r.stops)
              .map((stop) => (
                <div key={stop.stop_id} className="flex items-center gap-3 border-t px-4 py-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {stop.order}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{stop.container_name ?? stop.container_id}</p>
                    <p className="text-xs text-muted-foreground">{stop.address}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">{stop.status}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
