"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlarmEvent } from "@/types";
import { AlarmSeverityBadge, AlarmStatusBadge } from "@/components/alarms/alarm-severity-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { acknowledgeAlarm, fetchMediaBlob, ignoreAlarm, resolveAlarm } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { formatApiDateTime } from "@/lib/dates";

interface Props {
  alarm: AlarmEvent | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function AlarmDetailSheet({ alarm, onClose, onRefresh }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [pending, setPending] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const actor = user?.email ?? user?.name ?? "unknown";

  const mediaId = alarm?.media_ids?.[0];
  useEffect(() => {
    if (!mediaId) { setImageSrc(null); return; }
    let blobUrl: string | null = null;
    let cancelled = false;
    fetchMediaBlob(mediaId)
      .then((url) => {
        if (cancelled) { URL.revokeObjectURL(url); return; }
        blobUrl = url;
        setImageSrc(url);
      })
      .catch(() => { if (!cancelled) setImageSrc(null); });
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [mediaId]);

  const wrap = async (fn: () => Promise<void>) => {
    setPending(true);
    try {
      await fn();
      onRefresh();
      onClose();
    } finally {
      setPending(false);
    }
  };

  const handleAck = () =>
    wrap(async () => {
      await acknowledgeAlarm(alarm!.event_id, actor);
      toast.success("Alarm acknowledged");
    });

  const handleResolve = () =>
    wrap(async () => {
      await resolveAlarm(alarm!.event_id, actor);
      toast.success("Alarm resolved");
    });

  const handleIgnore = () =>
    wrap(async () => {
      await ignoreAlarm(alarm!.event_id, actor);
      toast.info("Alarm ignored");
    });

  return (
    <Sheet open={!!alarm} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[calc(100vw-1rem)] overflow-hidden sm:max-w-md">
        {alarm && (
          <>
            <SheetHeader className="border-b px-5 py-4 pr-12">
              <SheetTitle className="flex min-w-0 flex-wrap items-center gap-2 text-sm leading-6">
                <AlarmSeverityBadge severity={alarm.severity} />
                <span className="min-w-0 break-words font-mono text-xs">{alarm.type}</span>
              </SheetTitle>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {/* Event image */}
              {imageSrc && (
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={imageSrc}
                    alt="Event capture"
                    className="w-full object-cover"
                    style={{ maxHeight: 220 }}
                  />
                </div>
              )}

              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Summary</p>
                <p className="break-words text-sm leading-5">{alarm.summary}</p>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="min-w-0 rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Container</p>
                  <p className="mt-1 truncate font-mono text-xs">{alarm.container_id}</p>
                </div>
                <div className="min-w-0 rounded-lg border p-3">
                  <p className="mb-1 text-xs text-muted-foreground">Status</p>
                  <AlarmStatusBadge status={alarm.status} />
                </div>
                <div className="min-w-0 rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Started</p>
                  <p className="mt-1 break-words text-xs">{formatApiDateTime(alarm.started_at)}</p>
                </div>
                {alarm.ended_at && (
                  <div className="min-w-0 rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Ended</p>
                    <p className="mt-1 break-words text-xs">{formatApiDateTime(alarm.ended_at)}</p>
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
                  onClick={() => router.push(`/dashboard/containers/${alarm.container_id}`)}
                >
                  View container
                </Button>
                {alarm.status === "OPEN" && (
                  <>
                    <Button size="sm" className="w-full" disabled={pending} onClick={handleAck}>Acknowledge</Button>
                    <Button size="sm" className="w-full" variant="secondary" disabled={pending} onClick={handleResolve}>Resolve</Button>
                    <Button size="sm" className="w-full" variant="ghost" disabled={pending} onClick={handleIgnore}>Ignore</Button>
                  </>
                )}
                {alarm.status === "ACKNOWLEDGED" && (
                  <Button size="sm" className="w-full" disabled={pending} onClick={handleResolve}>Resolve</Button>
                )}
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
