"use client";

import { useCallback, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Container } from "@/types";
import { ContainersTable } from "@/components/containers/containers-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolling } from "@/hooks/use-polling";
import { getContainers } from "@/lib/api/client";

export default function ContainersPage() {
  const [fillFilter, setFillFilter] = useState("all");
  const [cameraFilter, setCameraFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetcher = useCallback(
    () => getContainers({ status: statusFilter !== "all" ? statusFilter : undefined }),
    [statusFilter]
  );
  const { data, isLoading, refresh } = usePolling(fetcher, 30_000);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Containers</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} containers total</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Container
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search by name or address…"
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

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <ContainersTable containers={containers} />
      )}
    </div>
  );
}
