"use client";

import { FormEvent, useCallback, useState } from "react";
import { MapPin, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Container, ContainerStatus, ContainerType } from "@/types";
import { ContainersTable } from "@/components/containers/containers-table";
import { ContainerLocationPicker } from "@/components/maps/container-location-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolling } from "@/hooks/use-polling";
import { createContainer, createDeviceClaimCode, getContainers } from "@/lib/api/client";

const DEFAULT_LAT = 41.3874;
const DEFAULT_LNG = 2.1686;

type ContainerForm = {
  container_id: string;
  name: string;
  site_id: string;
  address: string;
  status: ContainerStatus;
  container_type: ContainerType;
  volume_l: string;
  max_payload_kg: string;
  lat: string;
  lng: string;
  claim_code: string;
};

function buildDefaultForm(): ContainerForm {
  return {
    container_id: "",
    name: "",
    site_id: "",
    address: "",
    status: "ACTIVE",
    container_type: "UNDERGROUND",
    volume_l: "3000",
    max_payload_kg: "400",
    lat: String(DEFAULT_LAT),
    lng: String(DEFAULT_LNG),
    claim_code: "",
  };
}

export default function ContainersPage() {
  const [fillFilter, setFillFilter] = useState("all");
  const [cameraFilter, setCameraFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ContainerForm>(buildDefaultForm);

  const fetcher = useCallback(
    () => getContainers({ status: statusFilter !== "all" ? statusFilter : undefined }),
    [statusFilter]
  );
  const { data, isLoading, refresh } = usePolling(fetcher, 10_000);

  const containers = (data?.items ?? []).filter((c: Container) => {
    if (fillFilter !== "all" && c.latest_state.fill_state !== fillFilter) return false;
    if (cameraFilter !== "all" && c.latest_state.camera_state !== cameraFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.address ?? "").toLowerCase().includes(q) ||
        (c.site_id ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const updateForm = <K extends keyof ContainerForm>(field: K, value: ContainerForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateContainer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const containerId = form.container_id.trim();
    const name = form.name.trim();
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    const volume = Number(form.volume_l);
    const maxPayload = Number(form.max_payload_kg);

    if (!containerId || !name) {
      toast.error("Container ID and name are required");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error("Choose a valid map location");
      return;
    }

    setCreating(true);
    try {
      await createContainer({
        container_id: containerId,
        name,
        site_id: form.site_id.trim() || undefined,
        address: form.address.trim() || undefined,
        status: form.status,
        container_type: form.container_type,
        location: {
          type: "Point",
          coordinates: [lng, lat],
        },
        capacity: {
          volume_l: Number.isFinite(volume) ? volume : undefined,
          max_payload_kg: Number.isFinite(maxPayload) ? maxPayload : undefined,
        },
        latest_state: {},
      });

      const claimCode = form.claim_code.trim();
      if (claimCode) {
        await createDeviceClaimCode({ container_id: containerId, code: claimCode });
      }

      toast.success("Container created");
      setCreateOpen(false);
      setForm(buildDefaultForm());
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create container");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Containers</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} containers total</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Container
          </DialogTrigger>
          <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Add Container</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreateContainer}>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="container-id">Container ID</Label>
                    <Input
                      id="container-id"
                      value={form.container_id}
                      onChange={(event) => updateForm("container_id", event.target.value)}
                      placeholder="bin-bg-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="container-name">Name</Label>
                    <Input
                      id="container-name"
                      value={form.name}
                      onChange={(event) => updateForm("name", event.target.value)}
                      placeholder="Main Square underground container"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-id">Site ID</Label>
                    <Input
                      id="site-id"
                      value={form.site_id}
                      onChange={(event) => updateForm("site_id", event.target.value)}
                      placeholder="site-belgrade-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(event) => updateForm("address", event.target.value)}
                      placeholder="Main Square 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(value) => updateForm("status", value as ContainerStatus)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Container type</Label>
                    <Select value={form.container_type} onValueChange={(value) => updateForm("container_type", value as ContainerType)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNDERGROUND">Underground</SelectItem>
                        <SelectItem value="ABOVE_GROUND">Above ground</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="volume">Volume (L)</Label>
                    <Input
                      id="volume"
                      type="number"
                      min={0}
                      value={form.volume_l}
                      onChange={(event) => updateForm("volume_l", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payload">Max payload (kg)</Label>
                    <Input
                      id="payload"
                      type="number"
                      min={0}
                      value={form.max_payload_kg}
                      onChange={(event) => updateForm("max_payload_kg", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="claim-code">Device claim code</Label>
                    <Input
                      id="claim-code"
                      value={form.claim_code}
                      onChange={(event) => updateForm("claim_code", event.target.value)}
                      placeholder="TEAM-DEMO-123456"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Label>Location</Label>
                  </div>
                  <ContainerLocationPicker
                    lat={Number(form.lat) || DEFAULT_LAT}
                    lng={Number(form.lng) || DEFAULT_LNG}
                    onChange={({ lat, lng }) =>
                      setForm((current) => ({
                        ...current,
                        lat: lat.toFixed(6),
                        lng: lng.toFixed(6),
                      }))
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitude</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        value={form.lat}
                        onChange={(event) => updateForm("lat", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitude</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        value={form.lng}
                        onChange={(event) => updateForm("lng", event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create container"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search by name or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-56 text-sm"
        />
        <Select value={fillFilter} onValueChange={(v) => setFillFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Fill state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All fill states</SelectItem>
            <SelectItem value="EMPTY">Empty</SelectItem>
            <SelectItem value="NORMAL">Normal</SelectItem>
            <SelectItem value="NEAR_FULL">Near Full</SelectItem>
            <SelectItem value="FULL">Full</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={cameraFilter} onValueChange={(v) => setCameraFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-40 text-sm">
            <SelectValue placeholder="Camera state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All camera states</SelectItem>
            <SelectItem value="EVERYTHING_OK">OK</SelectItem>
            <SelectItem value="GARBAGE_DETECTED">Garbage Detected</SelectItem>
            <SelectItem value="CAMERA_FAULT">Camera Fault</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <ContainersTable containers={containers} onDeviceConfigSaved={refresh} />
      )}
    </div>
  );
}
