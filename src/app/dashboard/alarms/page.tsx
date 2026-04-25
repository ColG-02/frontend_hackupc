"use client";

import { useCallback, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Eye, RefreshCw } from "lucide-react";
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

export default function AlarmsPage() {
  const router = useRouter();
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmEvent | null>(null);

  const fetcher = useCallback(
    () =>
      getAlarms({
        severity: severityFilter !== "all" ? severityFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }).then((r) => r.items),
    [severityFilter, statusFilter]
  );

  const { data: alarms, isLoading, refresh } = usePolling(fetcher, 10_000);

  const handleAck = async (alarm: AlarmEvent) => {
    await acknowledgeAlarm(alarm.event_id);
    toast.success("Alarm acknowledged");
    refresh();
    setSelectedAlarm(null);
  };

  const handleResolve = async (alarm: AlarmEvent) => {
    await resolveAlarm(alarm.event_id);
    toast.success("Alarm resolved");
    refresh();
    setSelectedAlarm(null);
  };

  const handleIgnore = async (alarm: AlarmEvent) => {
    await ignoreAlarm(alarm.event_id);
    toast.info("Alarm ignored");
    refresh();
    setSelectedAlarm(null);
  };

  const sorted = [...(alarms ?? [])].sort((a, b) => {
    const sev = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    return (
      (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2) ||
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
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
                <TableHead className="w-[80px]">Actions</TableHead>
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
                      {formatDistanceToNow(new Date(alarm.started_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); setSelectedAlarm(alarm); }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
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
        <SheetContent>
          {selectedAlarm && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <AlarmSeverityBadge severity={selectedAlarm.severity} />
                  {selectedAlarm.type}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Summary</p>
                  <p className="text-sm">{selectedAlarm.summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Container</p><p>{selectedAlarm.container_id}</p></div>
                  <div><p className="text-xs text-muted-foreground">Status</p><AlarmStatusBadge status={selectedAlarm.status} /></div>
                  <div><p className="text-xs text-muted-foreground">Started</p><p>{new Date(selectedAlarm.started_at).toLocaleString()}</p></div>
                  {selectedAlarm.ended_at && <div><p className="text-xs text-muted-foreground">Ended</p><p>{new Date(selectedAlarm.ended_at).toLocaleString()}</p></div>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/containers/${selectedAlarm.container_id}`)}
                  >
                    View container
                  </Button>
                  {selectedAlarm.status === "OPEN" && (
                    <>
                      <Button size="sm" onClick={() => handleAck(selectedAlarm)}>Acknowledge</Button>
                      <Button size="sm" variant="secondary" onClick={() => handleResolve(selectedAlarm)}>Resolve</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleIgnore(selectedAlarm)}>Ignore</Button>
                    </>
                  )}
                  {selectedAlarm.status === "ACKNOWLEDGED" && (
                    <Button size="sm" onClick={() => handleResolve(selectedAlarm)}>Resolve</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
