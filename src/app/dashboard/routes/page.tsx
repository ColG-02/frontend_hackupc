"use client";

import { useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle, Clock, MapPin, Plus, RefreshCw, Truck } from "lucide-react";
import { RoutePlan } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { usePolling } from "@/hooks/use-polling";
import { dispatchRoutePlan, getRoutePlans } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  PLANNED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  DISPATCHED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function RoutesPage() {
  const router = useRouter();
  const fetcher = useCallback(() => getRoutePlans(), []);
  const { data: plans, isLoading, refresh } = usePolling(fetcher, 30_000);

  const handleDispatch = async (planId: string) => {
    await dispatchRoutePlan(planId);
    toast.success("Route plan dispatched");
    refresh();
  };

  const routePlans: RoutePlan[] = plans ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Route Planning</h1>
          <p className="text-sm text-muted-foreground">{routePlans.length} plans</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Route Plan
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5 mr-2" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {routePlans.map((plan) => {
            const completed = plan.summary.completed_stops ?? 0;
            const total = plan.summary.stops ?? 0;
            const pct = total > 0 ? (completed / total) * 100 : 0;

            return (
              <Card
                key={plan.route_plan_id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/dashboard/routes/${plan.route_plan_id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Route Plan — {plan.date}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.dispatched_at && !isNaN(Date.parse(plan.dispatched_at))
                          ? `Dispatched ${formatDistanceToNow(new Date(plan.dispatched_at), { addSuffix: true })}`
                          : plan.created_at && !isNaN(Date.parse(plan.created_at))
                          ? `Created ${formatDistanceToNow(new Date(plan.created_at), { addSuffix: true })}`
                          : `Plan for ${plan.date}`}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", STATUS_COLOR[plan.status] ?? "")}
                    >
                      {plan.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Truck className="h-3.5 w-3.5" />
                      <span>{plan.summary.vehicles_used} vehicle{plan.summary.vehicles_used !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{total} stops</span>
                    </div>
                    {plan.summary.estimated_distance_km && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{plan.summary.estimated_distance_km.toFixed(1)} km</span>
                      </div>
                    )}
                    {plan.summary.estimated_duration_min && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{plan.summary.estimated_duration_min} min</span>
                      </div>
                    )}
                  </div>

                  {(plan.status === "IN_PROGRESS" || plan.status === "COMPLETED") && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          <CheckCircle className="inline h-3 w-3 text-green-500 mr-0.5" />
                          {completed}/{total} stops
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/routes/${plan.route_plan_id}`);
                      }}
                    >
                      <Calendar className="mr-1 h-3 w-3" />
                      View detail
                    </Button>
                    {plan.status === "PLANNED" && (
                      <Button
                        size="sm"
                        className="flex-1 text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDispatch(plan.route_plan_id);
                        }}
                      >
                        Dispatch
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
