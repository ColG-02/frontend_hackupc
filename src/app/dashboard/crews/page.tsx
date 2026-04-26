"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolling } from "@/hooks/use-polling";
import { getCrews } from "@/lib/api/client";
import { formatApiDistanceToNow } from "@/lib/dates";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  ON_DUTY: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  IN_ROUTE: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  AT_STOP: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  ON_BREAK: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  OFF_DUTY: "bg-gray-100 text-gray-500 dark:bg-gray-800",
  UNKNOWN: "bg-gray-100 text-gray-500",
};

export default function CrewsPage() {
  const router = useRouter();
  const fetcher = useCallback(() => getCrews(), []);
  const { data: crews, isLoading, refresh } = usePolling(fetcher, 10_000);

  const allCrews = crews ?? [];
  const onDuty = allCrews.filter((c) => c.status !== "OFF_DUTY").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cleaning Crews</h1>
          <p className="text-sm text-muted-foreground">
            {onDuty} of {allCrews.length} on duty
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allCrews.map((crew) => (
            <Card
              key={crew.crew_id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/dashboard/crews/${crew.crew_id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold">{crew.name}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs shrink-0", STATUS_COLOR[crew.status] ?? "")}
                  >
                    {crew.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{crew.members_count} member{crew.members_count !== 1 ? "s" : ""}</span>
                    {crew.vehicle_id && <span>· {crew.vehicle_id}</span>}
                  </div>
                  {crew.current_location ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs">
                        GPS {formatApiDistanceToNow(crew.current_location.updated_at)}
                        {crew.current_location.speed_mps && crew.current_location.speed_mps > 0 && (
                          <span> · {(crew.current_location.speed_mps * 3.6).toFixed(0)} km/h</span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="text-xs">No GPS</span>
                    </div>
                  )}
                  {crew.assigned_route_plan_id && (
                    <p className="text-xs text-muted-foreground">
                      Route: {crew.assigned_route_plan_id}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
