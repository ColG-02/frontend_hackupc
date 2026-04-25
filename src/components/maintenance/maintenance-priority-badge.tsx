import { Badge } from "@/components/ui/badge";
import { MaintenancePriority, MaintenanceStatus } from "@/types";
import { cn } from "@/lib/utils";

export function MaintenancePriorityBadge({ priority }: { priority: MaintenancePriority }) {
  const map: Record<MaintenancePriority, { label: string; class: string }> = {
    LOW: { label: "Low", class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
    MEDIUM: { label: "Medium", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    HIGH: { label: "High", class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
    CRITICAL: { label: "Critical", class: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  };
  const cfg = map[priority] ?? map.LOW;
  return <Badge variant="secondary" className={cn("text-xs font-medium", cfg.class)}>{cfg.label}</Badge>;
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const map: Record<MaintenanceStatus, { label: string; class: string }> = {
    OPEN: { label: "Open", class: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
    IN_PROGRESS: { label: "In Progress", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    RESOLVED: { label: "Resolved", class: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    CANCELLED: { label: "Cancelled", class: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  };
  const cfg = map[status] ?? map.OPEN;
  return <Badge variant="secondary" className={cn("text-xs font-medium", cfg.class)}>{cfg.label}</Badge>;
}
