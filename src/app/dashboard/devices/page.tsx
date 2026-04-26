"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { LinkIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Container, Device } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeviceStatusBadge } from "@/components/containers/container-state-badge";
import { assignDeviceToContainer, getContainers, getDevices } from "@/lib/api/client";
import { usePolling } from "@/hooks/use-polling";

const EMPTY_DEVICES: Device[] = [];
const EMPTY_CONTAINERS: Container[] = [];

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DevicesPage() {
  const [assigning, setAssigning] = useState(false);
  const [assignDeviceId, setAssignDeviceId] = useState("");
  const [assignContainerId, setAssignContainerId] = useState("");

  const fetchProvisioningData = useCallback(async () => {
    const [deviceResult, containerResult] = await Promise.all([
      getDevices(),
      getContainers({ limit: 200 }),
    ]);
    return {
      devices: deviceResult.items,
      containers: containerResult.items,
    };
  }, []);

  const { data, isLoading, refresh } = usePolling(fetchProvisioningData, 30_000);
  const devices = data?.devices ?? EMPTY_DEVICES;
  const containers = data?.containers ?? EMPTY_CONTAINERS;

  const unassignedContainers = useMemo(
    () =>
      containers.filter(
        (container) =>
          !container.assigned_device_id || container.assigned_device_id === assignDeviceId
      ),
    [assignDeviceId, containers]
  );

  const unassignedDevices = useMemo(
    () => devices.filter((device) => !device.container_id),
    [devices]
  );

  const handleAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignDeviceId || !assignContainerId) {
      toast.error("Choose a device and container");
      return;
    }
    setAssigning(true);
    try {
      await assignDeviceToContainer(assignDeviceId, assignContainerId);
      toast.success("Device assigned");
      setAssignDeviceId("");
      setAssignContainerId("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign device");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Devices</h1>
          <p className="text-sm text-muted-foreground">
            {devices.length} registered device records
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Card className="max-w-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <LinkIcon className="h-4 w-4" />
            Assign existing device
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleAssign}>
            <div className="space-y-2">
              <Label>Device</Label>
              <Select value={assignDeviceId} onValueChange={(value) => setAssignDeviceId(value ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose unassigned device" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedDevices.map((device) => (
                    <SelectItem key={device.device_id} value={device.device_id}>
                      {device.device_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Container</Label>
              <Select value={assignContainerId} onValueChange={(value) => setAssignContainerId(value ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose container" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedContainers.map((container) => (
                    <SelectItem key={container.container_id} value={container.container_id}>
                      {container.container_id} - {container.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="outline" disabled={assigning || !unassignedDevices.length}>
                <LinkIcon className="h-4 w-4" />
                {assigning ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Device registry</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Factory ID</TableHead>
                <TableHead>Container</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Firmware</TableHead>
                <TableHead>Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.device_id}>
                  <TableCell className="font-mono">{device.device_id}</TableCell>
                  <TableCell className="font-mono">{device.factory_device_id ?? "-"}</TableCell>
                  <TableCell>{device.container_id ?? "Unassigned"}</TableCell>
                  <TableCell>
                    <DeviceStatusBadge status={device.status} />
                  </TableCell>
                  <TableCell>{device.firmware?.linux_app_version ?? "-"}</TableCell>
                  <TableCell>{formatDate(device.last_seen_at)}</TableCell>
                </TableRow>
              ))}
              {!devices.length && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No registered devices yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
