"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlarmEvent } from "@/types";
import { AlarmSeverityBadge, AlarmStatusBadge } from "@/components/alarms/alarm-severity-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { acknowledgeAlarm, resolveAlarm } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { compareApiDatesDesc, formatApiDistanceToNow } from "@/lib/dates";
import { toast } from "sonner";

interface Props {
  alarms: AlarmEvent[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function AlarmFeed({ alarms, isLoading, onRefresh }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const actor = user?.email ?? user?.name ?? "unknown";

  const handleAck = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      try {
        await acknowledgeAlarm(id, actor);
        toast.success("Alarm acknowledged");
        onRefresh?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not acknowledge alarm");
      }
    },
    [actor, onRefresh]
  );

  const handleResolve = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      try {
        await resolveAlarm(id, actor);
        toast.success("Alarm resolved");
        onRefresh?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not resolve alarm");
      }
    },
    [actor, onRefresh]
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Active Alarms</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}
        {!isLoading && alarms.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No active alarms
          </div>
        )}
        <ul className="divide-y">
          {alarms
            .sort((a, b) => {
              const sev = { CRITICAL: 0, WARNING: 1, INFO: 2 };
              return (
                (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2) ||
                compareApiDatesDesc(a.started_at, b.started_at)
              );
            })
            .slice(0, 8)
            .map((alarm) => (
              <li
                key={alarm.event_id}
                className="cursor-pointer px-4 py-3 hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/dashboard/alarms`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <AlarmSeverityBadge severity={alarm.severity} />
                      <AlarmStatusBadge status={alarm.status} />
                      <span className="text-xs text-muted-foreground">
                        {alarm.container_id}
                      </span>
                    </div>
                    <p className="text-xs text-foreground truncate">{alarm.summary}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatApiDistanceToNow(alarm.started_at)}
                    </p>
                  </div>
                  {alarm.status === "OPEN" && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => handleAck(e, alarm.event_id)}
                      >
                        Ack
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => handleResolve(e, alarm.event_id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
        </ul>
        {alarms.length > 0 && (
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => router.push("/dashboard/alarms")}
            >
              View all alarms →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
