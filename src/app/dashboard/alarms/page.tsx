"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Eye, RefreshCw } from "lucide-react";
import { AlarmEvent } from "@/types";
import { AlarmSeverityBadge, AlarmStatusBadge } from "@/components/alarms/alarm-severity-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { usePolling } from "@/hooks/use-polling";
import {
  acknowledgeAlarm,
  getAlarms,
  ignoreAlarm,
  resolveAlarm,
} from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { compareApiDatesDesc, formatApiDateTime, formatApiDistanceToNow } from "@/lib/dates";

export default function AlarmsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmEvent | null>(null);
  const [pendingAckId, setPendingAckId] = useState<string | null>(null);

  const fetcher = useCallback(
    () =>
      getAlarms({
        severity: severityFilter !== "all" ? severityFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }).then((r) => r.items),
    [severityFilter, statusFilter]
  );

  const { data: alarms, isLoading, refresh } = usePolling(fetcher, 10_000);

  const actor = user?.email ?? user?.name ?? "unknown";

  const handleAck = async (alarm: AlarmEvent) => {
    setPendingAckId(alarm.event_id);
    try {
      await acknowledgeAlarm(alarm.event_id, actor);
      toast.success("Alarm acknowledged");
      refresh();
      setSelectedAlarm(null);
    } finally {
      setPendingAckId(null);
    }
  };

  const handleResolve = async (alarm: AlarmEvent) => {
    await resolveAlarm(alarm.event_id, actor);
    toast.success("Alarm resolved");
    refresh();
    setSelectedAlarm(null);
  };

  const handleIgnore = async (alarm: AlarmEvent) => {
    await ignoreAlarm(alarm.event_id, actor);
    toast.info("Alarm ignored");
    refresh();
    setSelectedAlarm(null);
  };

  const sorted = [...(alarms ?? [])].sort((a, b) => {
    const sev = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    return (
      (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2) ||
      compareApiDatesDesc(a.started_at, b.started_at)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Alarms</h1>
          <p className="text-sm text-muted-foreground">{sorted.length} events</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="WARNING">Warning</SelectItem>
            <SelectItem value="INFO">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="IGNORED">Ignored</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Container</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>When</TableHead>
                <TableHead className="w-[110px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No alarms found.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((alarm) => (
                  <TableRow
                    key={alarm.event_id}
                    className="cursor-pointer"
                    onClick={() => setSelectedAlarm(alarm)}
                  >
                    <TableCell><AlarmSeverityBadge severity={alarm.severity} /></TableCell>
                    <TableCell className="text-xs font-mono">{alarm.type}</TableCell>
                    <TableCell className="text-xs">{alarm.container_id}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{alarm.summary}</TableCell>
                    <TableCell><AlarmStatusBadge status={alarm.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatApiDistanceToNow(alarm.started_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {alarm.status === "OPEN" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={pendingAckId === alarm.event_id}
                            onClick={(e) => { e.stopPropagation(); handleAck(alarm); }}
                            title="Acknowledge"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); setSelectedAlarm(alarm); }}
                          title="View details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Alarm detail sheet */}
      <Sheet open={!!selectedAlarm} onOpenChange={(o) => !o && setSelectedAlarm(null)}>
        <SheetContent className="w-[calc(100vw-1rem)] overflow-hidden sm:max-w-md">
          {selectedAlarm && (
            <>
              <SheetHeader className="border-b px-5 py-4 pr-12">
                <SheetTitle className="flex min-w-0 flex-wrap items-center gap-2 text-sm leading-6">
                  <AlarmSeverityBadge severity={selectedAlarm.severity} />
                  <span className="min-w-0 break-words font-mono text-xs">
                    {selectedAlarm.type}
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Summary</p>
                  <p className="break-words text-sm leading-5">{selectedAlarm.summary}</p>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="min-w-0 rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Container</p>
                    <p className="mt-1 truncate font-mono text-xs">{selectedAlarm.container_id}</p>
                  </div>
                  <div className="min-w-0 rounded-lg border p-3">
                    <p className="mb-1 text-xs text-muted-foreground">Status</p>
                    <AlarmStatusBadge status={selectedAlarm.status} />
                  </div>
                  <div className="min-w-0 rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="mt-1 break-words text-xs">{formatApiDateTime(selectedAlarm.started_at)}</p>
                  </div>
                  {selectedAlarm.ended_at && (
                    <div className="min-w-0 rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Ended</p>
                      <p className="mt-1 break-words text-xs">{formatApiDateTime(selectedAlarm.ended_at)}</p>
                    </div>
                  )}
                </div>
              </div>
              <SheetFooter className="border-t bg-background/95 px-5 py-4">
                <div className="grid w-full gap-2 sm:grid-cols-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/containers/${selectedAlarm.container_id}`)}
                  >
                    View container
                  </Button>
                  {selectedAlarm.status === "OPEN" && (
                    <>
                      <Button size="sm" className="w-full" onClick={() => handleAck(selectedAlarm)}>Acknowledge</Button>
                      <Button size="sm" className="w-full" variant="secondary" onClick={() => handleResolve(selectedAlarm)}>Resolve</Button>
                      <Button size="sm" className="w-full" variant="ghost" onClick={() => handleIgnore(selectedAlarm)}>Ignore</Button>
                    </>
                  )}
                  {selectedAlarm.status === "ACKNOWLEDGED" && (
                    <Button size="sm" className="w-full" onClick={() => handleResolve(selectedAlarm)}>Resolve</Button>
                  )}
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
