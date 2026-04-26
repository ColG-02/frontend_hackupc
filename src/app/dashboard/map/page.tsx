"use client";

import { useCallback } from "react";
import {
  AlertTriangle,
  Flame,
  MapPin,
  RefreshCw,
  Trash2,
  Truck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { OperationsMap } from "@/components/maps/operations-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolling } from "@/hooks/use-polling";
import { getAlarms, getContainers, getCrews } from "@/lib/api/client";

function StatRow({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof Trash2;
  tone?: "default" | "green" | "yellow" | "orange" | "red" | "purple" | "blue" | "gray";
}) {
  const toneClass = {
    default: "bg-muted text-foreground",
    green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  }[tone];

  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}


export default function DashboardMapPage() {
  const fetchContainers = useCallback(() => getContainers().then((result) => result.items), []);
  const fetchCrews = useCallback(() => getCrews(), []);
  const fetchAlarms = useCallback(() => getAlarms({ status: "OPEN" }).then((result) => result.items), []);

  const containers = usePolling(fetchContainers, 30_000);
  const crews = usePolling(fetchCrews, 10_000);
  const alarms = usePolling(fetchAlarms, 10_000);

  const allContainers = containers.data ?? [];
  const online = allContainers.filter((container) => container.latest_state.device_status === "ONLINE").length;
  const offline = allContainers.filter(
    (container) =>
      container.latest_state.device_status === "OFFLINE" ||
      container.latest_state.device_status === "FAULT"
  ).length;
  const nearFull = allContainers.filter((container) => container.latest_state.fill_state === "NEAR_FULL").length;
  const fullCritical = allContainers.filter(
    (container) =>
      container.latest_state.fill_state === "FULL" ||
      container.latest_state.fill_state === "CRITICAL"
  ).length;
  const garbageDetected = allContainers.filter(
    (container) => container.latest_state.camera_state === "GARBAGE_DETECTED"
  ).length;
  const flameDetected = allContainers.filter((container) => container.latest_state.flame_detected).length;
  const handleRefresh = () => {
    containers.refresh();
    crews.refresh();
    alarms.refresh();
  };

  return (
    <div className="flex h-[calc(100vh-5.5rem)] min-h-[640px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Operations Map</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-h-[420px] overflow-hidden rounded-lg border bg-card">
          {containers.isLoading ? (
            <Skeleton className="h-full w-full rounded-none" />
          ) : (
            <OperationsMap containers={allContainers} crews={crews.data ?? []} height="100%" />
          )}
        </section>

        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                City Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatRow label="Containers" value={allContainers.length} icon={Trash2} />
              <StatRow label="Online" value={online} icon={Wifi} tone="green" />
              <StatRow label="Offline / fault" value={offline} icon={WifiOff} tone="gray" />
              <StatRow label="Near full" value={nearFull} icon={MapPin} tone="yellow" />
              <StatRow label="Full / critical" value={fullCritical} icon={Trash2} tone="orange" />
              <StatRow label="Garbage detected" value={garbageDetected} icon={AlertTriangle} tone="purple" />
              <StatRow label="Flame alerts" value={flameDetected} icon={Flame} tone="red" />
              <StatRow label="Open alarms" value={alarms.data?.length ?? 0} icon={AlertTriangle} tone="red" />
              <StatRow label="Crews active" value={crews.data?.filter((crew) => crew.status !== "OFF_DUTY").length ?? 0} icon={Truck} tone="blue" />
            </CardContent>
          </Card>

        </aside>
      </div>
    </div>
  );
}
