"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolling } from "@/hooks/use-polling";
import { getCrews, getRoutePlan } from "@/lib/api/client";
import { RouteStop } from "@/types";
import { cn } from "@/lib/utils";

const CREW_ID = "crew-alpha";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  ARRIVED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-700",
  SKIPPED: "bg-orange-100 text-orange-700",
  FAILED: "bg-red-100 text-red-700",
};

function getStopSortOrder(status: string): number {
  return { IN_PROGRESS: 0, ARRIVED: 1, PENDING: 2, FAILED: 3, SKIPPED: 4, COMPLETED: 5 }[status] ?? 9;
}

export default function CrewStopsPage() {
  const router = useRouter();

  const fetchCrews = useCallback(() => getCrews(), []);
  const { data: crews } = usePolling(fetchCrews, 30_000);
  const crew = crews?.find((c) => c.crew_id === CREW_ID) ?? crews?.[0];

  const fetchRoute = useCallback(
    () =>
      crew?.assigned_route_plan_id
        ? getRoutePlan(crew.assigned_route_plan_id)
        : Promise.resolve(null),
    [crew?.assigned_route_plan_id]
  );
  const { data: routePlan, isLoading } = usePolling(fetchRoute, 30_000, !!crew?.assigned_route_plan_id);

  const myRoute =
    routePlan?.routes.find((r) => r.crew_id === CREW_ID) ??
    routePlan?.routes[0] ??
    null;
  const stops: RouteStop[] = [...(myRoute?.stops ?? [])].sort(
    (a, b) => getStopSortOrder(a.status) - getStopSortOrder(b.status) || a.order - b.order
  );

  const completed = stops.filter((s) => s.status === "COMPLETED").length;

  return (
    <div className="p-3 space-y-3 max-w-lg mx-auto">
      <div className="pt-2">
        <h2 className="text-lg font-semibold">Assigned Stops</h2>
        <p className="text-sm text-muted-foreground">
          {completed}/{stops.length} completed
        </p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {!isLoading && stops.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No stops assigned
        </div>
      )}

      {stops.map((stop) => (
        <Card
          key={stop.stop_id}
          className={cn(
            "cursor-pointer hover:shadow-sm transition-shadow",
            stop.status === "COMPLETED" && "opacity-60"
          )}
          onClick={() => router.push(`/crew/stops/${stop.stop_id}`)}
        >
          <CardContent className="p-3 flex items-start gap-3">
            {/* Order badge */}
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                STATUS_COLOR[stop.status] ?? "bg-gray-100"
              )}
            >
              {stop.status === "COMPLETED" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                stop.order
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {stop.container_name ?? stop.container_id}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate">{stop.address}</p>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {stop.reason.map((r) => (
                  <span
                    key={r}
                    className="text-[10px] bg-muted rounded px-1.5 py-0.5 font-medium"
                  >
                    {r}
                  </span>
                ))}
                {stop.fill_pct !== undefined && (
                  <span className="text-[10px] text-muted-foreground">
                    {stop.fill_pct}% full
                  </span>
                )}
              </div>
            </div>

            {/* Status + chevron */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge
                variant="secondary"
                className={cn("text-[10px]", STATUS_COLOR[stop.status] ?? "")}
              >
                {stop.status}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
