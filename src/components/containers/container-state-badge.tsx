import { Badge } from "@/components/ui/badge";
import { FillState, CameraState, DeviceStatus } from "@/types";
import { cn } from "@/lib/utils";

export function FillStateBadge({ state }: { state?: FillState }) {
  const map: Record<FillState, { label: string; class: string }> = {
    EMPTY: { label: "Empty", class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
    NORMAL: { label: "Normal", class: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    NEAR_FULL: { label: "Near Full", class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
    FULL: { label: "Full", class: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
    CRITICAL: { label: "Critical", class: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
    UNKNOWN: { label: "Unknown", class: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  };
  const cfg = map[state ?? "UNKNOWN"] ?? map.UNKNOWN;
  return (
    <Badge variant="secondary" className={cn("text-xs font-medium", cfg.class)}>
      {cfg.label}
    </Badge>
  );
}

export function CameraStateBadge({ state }: { state?: CameraState }) {
  const map: Record<CameraState, { label: string; class: string }> = {
    EVERYTHING_OK: { label: "OK", class: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    GARBAGE_DETECTED: { label: "Garbage", class: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
    UNKNOWN: { label: "Unknown", class: "bg-gray-100 text-gray-500" },
    CAMERA_FAULT: { label: "Fault", class: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  };
  const cfg = map[state ?? "UNKNOWN"] ?? map.UNKNOWN;
  return (
    <Badge variant="secondary" className={cn("text-xs font-medium", cfg.class)}>
      {cfg.label}
    </Badge>
  );
}

export function DeviceStatusBadge({ status }: { status?: DeviceStatus }) {
  const map: Record<DeviceStatus, { label: string; class: string }> = {
    ONLINE: { label: "Online", class: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    OFFLINE: { label: "Offline", class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
    DEGRADED: { label: "Degraded", class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
    FAULT: { label: "Fault", class: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
    UNKNOWN: { label: "Unknown", class: "bg-gray-100 text-gray-500" },
  };
  const cfg = map[status ?? "UNKNOWN"] ?? map.UNKNOWN;
  return (
    <Badge variant="secondary" className={cn("text-xs font-medium", cfg.class)}>
      {cfg.label}
    </Badge>
  );
}
