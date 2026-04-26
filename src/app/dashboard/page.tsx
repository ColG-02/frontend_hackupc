"use client";

import { useCallback } from "react";
import {
  AlertTriangle,
  Flame,
  MapPin,
  RefreshCw,
  Trash2,
  Truck,
  Users,
  Wifi,
  WifiOff,
  Wrench,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AlarmFeed } from "@/components/dashboard/alarm-feed";
import { FillDistributionChart } from "@/components/dashboard/fill-distribution-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePolling } from "@/hooks/use-polling";
import {
  getAlarms,
  getContainers,
  getDashboardSummary,
} from "@/lib/api/client";

export default function DashboardPage() {
  const fetchSummary = useCallback(() => getDashboardSummary(), []);
  const fetchContainers = useCallback(() => getContainers().then((r) => r.items), []);
  const fetchAlarms = useCallback(() => getAlarms({ status: "OPEN" }).then((r) => r.items), []);

  const summary = usePolling(fetchSummary, 15_000);
  const containers = usePolling(fetchContainers, 30_000);
  const alarms = usePolling(fetchAlarms, 10_000);

  const s = summary.data;
  const isLoadingKpi = summary.isLoading;
  const allContainers = containers.data ?? [];

  const totalOnline = allContainers.filter(
    (c) => c.latest_state.device_status === "ONLINE"
  ).length;
  const totalOffline = allContainers.filter(
    (c) => c.latest_state.device_status === "OFFLINE" || c.latest_state.device_status === "FAULT"
  ).length;
  const garbageDetected = allContainers.filter(
    (c) => c.latest_state.camera_state === "GARBAGE_DETECTED"
  ).length;
  const flameDetected = allContainers.filter(
    (c) => c.latest_state.flame_detected
  ).length;

  const handleRefresh = () => {
    summary.refresh();
    containers.refresh();
    alarms.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Operations Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
        <KpiCard title="Total Containers" value={s?.containers_total ?? allContainers.length} icon={Trash2} isLoading={isLoadingKpi} />
        <KpiCard title="Online" value={totalOnline} icon={Wifi} color="green" isLoading={isLoadingKpi} />
        <KpiCard title="Offline" value={totalOffline} icon={WifiOff} color="gray" isLoading={isLoadingKpi} />
        <KpiCard title="Near Full" value={s?.containers_near_full ?? 0} icon={MapPin} color="yellow" isLoading={isLoadingKpi} />
        <KpiCard title="Full / Critical" value={(s?.containers_full ?? 0) + (s?.containers_critical ?? 0)} icon={Trash2} color="orange" isLoading={isLoadingKpi} />
        <KpiCard title="Garbage Detected" value={garbageDetected} icon={AlertTriangle} color="purple" isLoading={isLoadingKpi} />
        <KpiCard title="Flame Alerts" value={flameDetected} icon={Flame} color="red" isLoading={isLoadingKpi} />
        <KpiCard title="Open Alarms" value={s?.open_alarms ?? 0} icon={AlertTriangle} color={s?.critical_alarms ? "red" : "yellow"} isLoading={isLoadingKpi} />
        <KpiCard title="Crews on Duty" value={s?.crews_on_duty ?? 0} icon={Users} color="blue" isLoading={isLoadingKpi} />
        <KpiCard title="Open Tickets" value={s?.open_tickets ?? 0} icon={Wrench} color="blue" isLoading={isLoadingKpi} />
      </div>

      {/* Lower row: alarms + chart */}
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <AlarmFeed
          alarms={alarms.data ?? []}
          isLoading={alarms.isLoading}
          onRefresh={alarms.refresh}
        />
        <div className="space-y-4">
          <FillDistributionChart containers={allContainers} />
          {/* Truck routes summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Active Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>{s?.active_route_plans ?? 0} route plan{(s?.active_route_plans ?? 0) !== 1 ? "s" : ""} active today</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
