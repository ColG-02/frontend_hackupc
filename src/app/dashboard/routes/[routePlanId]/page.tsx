"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { usePolling } from "@/hooks/use-polling";
import { getRoutePlan, updateRouteStop } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { RouteStop } from "@/types";

const STOP_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  ARRIVED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  SKIPPED: "bg-orange-100 text-orange-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function RoutePlanDetailPage() {
  const params = useParams<{ routePlanId: string }>();
  const router = useRouter();
  const planId = params.routePlanId;

  const fetcher = useCallback(() => getRoutePlan(planId), [planId]);
  const { data: plan, isLoading, refresh } = usePolling(fetcher, 15_000);

  const handleMarkComplete = async (stop: RouteStop) => {
    await updateRouteStop(planId, stop.stop_id, { status: "COMPLETED" });
    toast.success(`Stop ${stop.order} marked complete`);
    refresh();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Route plan not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const allStops = plan.routes.flatMap((r) => r.stops);
  const completed = allStops.filter((s) => s.status === "COMPLETED").length;
  const total = allStops.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Route Plan — {plan.date}</h1>
          <p className="text-sm text-muted-foreground">{plan.route_plan_id}</p>
        </div>
        <Badge className="ml-auto">{plan.status}</Badge>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{plan.summary.vehicles_used} vehicles</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{total} stops</span>
            </div>
            {plan.summary.estimated_distance_km && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{plan.summary.estimated_distance_km.toFixed(1)} km</span>
              </div>
            )}
            {plan.summary.estimated_duration_min && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{plan.summary.estimated_duration_min} min</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-medium">{completed}/{total} stops</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Routes and stops */}
      {plan.routes.map((route, ri) => (
        <Card key={route.route_id ?? ri}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {route.vehicle_id ?? `Route ${ri + 1}`}
              {route.crew_id && <span className="ml-2 text-muted-foreground font-normal text-xs">— {route.crew_id}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {route.stops.map((stop) => (
                <li key={stop.stop_id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {stop.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{stop.container_name ?? stop.container_id}</p>
                      <p className="text-xs text-muted-foreground">{stop.address}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {stop.reason.map((r) => (
                          <span key={r} className="text-xs bg-muted rounded px-1.5 py-0.5">{r}</span>
                        ))}
                        {stop.fill_pct !== undefined && (
                          <span className="text-xs text-muted-foreground">Fill: {stop.fill_pct}%</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", STOP_STATUS_COLOR[stop.status] ?? "")}
                      >
                        {stop.status}
                      </Badge>
                      {stop.status === "ARRIVED" || stop.status === "IN_PROGRESS" ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleMarkComplete(stop)}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Done
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
