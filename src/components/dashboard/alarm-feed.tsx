"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AlarmEvent } from "@/types";
import { AlarmSeverityBadge, AlarmStatusBadge } from "@/components/alarms/alarm-severity-badge";
import { AlarmDetailSheet } from "@/components/alarms/alarm-detail-sheet";
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
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmEvent | null>(null);
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
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Active Alarms</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 p-0">
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
        <ul className="min-w-0 divide-y">
          {[...alarms]
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
                className="min-w-0 cursor-pointer px-3 py-3 transition-colors hover:bg-muted/50 sm:px-4"
                onClick={() => setSelectedAlarm(alarm)}
              >
                <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                  <div className="min-w-0">
                    <div className="mb-1 flex min-w-0 flex-wrap items-center gap-1.5">
                      <AlarmSeverityBadge severity={alarm.severity} />
                      <AlarmStatusBadge status={alarm.status} />
                      <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
                        {alarm.container_id}
                      </span>
                    </div>
                    <p className="min-w-0 truncate text-xs text-foreground">{alarm.summary}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatApiDistanceToNow(alarm.started_at)}
                    </p>
                  </div>
                  {alarm.status === "OPEN" && (
                    <div className="flex shrink-0 flex-wrap gap-1 sm:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 min-w-12 px-2 text-xs"
                        onClick={(e) => handleAck(e, alarm.event_id)}
                      >
                        Ack
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 min-w-16 px-2 text-xs"
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
              View all alarms
            </Button>
          </div>
        )}
      </CardContent>

      <AlarmDetailSheet
        alarm={selectedAlarm}
        onClose={() => setSelectedAlarm(null)}
        onRefresh={() => onRefresh?.()}
      />
    </Card>
  );
}
