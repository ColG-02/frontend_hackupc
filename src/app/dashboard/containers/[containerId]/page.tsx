"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Droplets,
  Flame,
  RefreshCw,
  Settings2,
  Thermometer,
  Trash2,
  Wifi,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CameraStateBadge,
  DeviceStatusBadge,
  FillStateBadge,
} from "@/components/containers/container-state-badge";
import { DeviceConfigDialog } from "@/components/devices/device-config-dialog";
import { AlarmSeverityBadge, AlarmStatusBadge } from "@/components/alarms/alarm-severity-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolling } from "@/hooks/use-polling";
import {
  getAlarms,
  getContainer,
  getContainerTelemetry,
} from "@/lib/api/client";
import { formatApiDistanceToNow, formatApiTime } from "@/lib/dates";

export default function ContainerDetailPage() {
  const params = useParams<{ containerId: string }>();
  const router = useRouter();
  const containerId = params.containerId;

  const fetchContainer = useCallback(() => getContainer(containerId), [containerId]);
  const fetchTelemetry = useCallback(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
    return getContainerTelemetry(containerId, from.toISOString(), to.toISOString());
  }, [containerId]);
  const fetchAlarms = useCallback(
    () => getAlarms({ container_id: containerId }).then((r) => r.items),
    [containerId]
  );

  const { data: container, isLoading, refresh } = usePolling(fetchContainer, 15_000);
  const { data: telemetry } = usePolling(fetchTelemetry, 60_000);
  const { data: alarms } = usePolling(fetchAlarms, 15_000);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!container) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Container not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const ls = container.latest_state;
  const chartData = (telemetry ?? []).map((p) => ({
    time: formatApiTime(p.ts),
    fill: p.fused_fill_pct,
    temp: p.temperature_c,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{container.name}</h1>
            <FillStateBadge state={ls.fill_state} />
            <DeviceStatusBadge status={ls.device_status} />
            {ls.flame_detected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                <Flame className="h-3 w-3" />
                Flame Detected
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {container.address ?? container.site_id} · {container.container_id}
          </p>
          {ls.last_seen_at && (
            <p className="text-xs text-muted-foreground">
              Last seen{" "}
              {formatApiDistanceToNow(ls.last_seen_at)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {container.assigned_device_id && (
            <DeviceConfigDialog
              deviceId={container.assigned_device_id}
              onSaved={refresh}
              trigger={
                <Button variant="outline" size="sm">
                  <Settings2 className="mr-2 h-3.5 w-3.5" />
                  Device config
                </Button>
              }
            />
          )}
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live state cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {[
          { label: "Fill", value: `${(ls.fused_fill_pct ?? 0).toFixed(0)}%`, icon: Trash2 },
          { label: "Camera", value: <CameraStateBadge state={ls.camera_state} />, icon: null },
          { label: "Temp", value: ls.temperature_c ? `${ls.temperature_c.toFixed(1)}°C` : "—", icon: Thermometer },
          { label: "Humidity", value: ls.humidity_pct ? `${ls.humidity_pct.toFixed(0)}%` : "—", icon: Droplets },
          { label: "Distance", value: ls.ultrasonic_distance_cm ? `${ls.ultrasonic_distance_cm} cm` : "—", icon: Zap },
          { label: "Flame", value: ls.flame_detected ? `${(ls.flame_intensity_pct ?? 0).toFixed(0)}%` : "No", icon: Flame },
          { label: "Device", value: <DeviceStatusBadge status={ls.device_status} />, icon: Wifi },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <div className="flex items-center gap-1">
                {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
                <span className="text-sm font-semibold">{value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fill % (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}%`, "Fill"]} />
                <Line type="monotone" dataKey="fill" stroke="#ef4444" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Temperature (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}°C`, "Temp"]} />
                <Line type="monotone" dataKey="temp" stroke="#f59e0b" dot={false} strokeWidth={2} name="Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Technical details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Technical Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4 text-sm">
            <div><dt className="text-muted-foreground text-xs">Container ID</dt><dd className="font-mono">{container.container_id}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Device ID</dt><dd className="font-mono">{container.assigned_device_id ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Type</dt><dd>{container.container_type ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Site</dt><dd>{container.site_id ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Volume</dt><dd>{container.capacity?.volume_l ? `${container.capacity.volume_l} L` : "—"}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Max Payload</dt><dd>{container.capacity?.max_payload_kg ? `${container.capacity.max_payload_kg} kg` : "—"}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Config Rev.</dt><dd>{container.config_revision ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Status</dt><dd>{container.status}</dd></div>
          </dl>
        </CardContent>
      </Card>

      {/* Event history */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Event History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(alarms ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No events found</p>
          ) : (
            <ul className="divide-y">
              {(alarms ?? []).map((alarm) => (
                <li key={alarm.event_id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AlarmSeverityBadge severity={alarm.severity} />
                    <AlarmStatusBadge status={alarm.status} />
                    <span className="text-xs font-medium">{alarm.type}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatApiDistanceToNow(alarm.started_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{alarm.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
