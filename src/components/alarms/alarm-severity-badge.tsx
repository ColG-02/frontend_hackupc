import { Badge } from "@/components/ui/badge";
import { AlarmSeverity, AlarmStatus } from "@/types";
import { cn } from "@/lib/utils";

export function AlarmSeverityBadge({ severity }: { severity: AlarmSeverity }) {
  const map: Record<AlarmSeverity, { label: string; class: string }> = {
    INFO: { label: "Info", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    WARNING: { label: "Warning", class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
    CRITICAL: { label: "Critical", class: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  };
  const cfg = map[severity] ?? map.INFO;
  return (
    <Badge variant="secondary" className={cn("text-xs font-medium", cfg.class)}>
      {cfg.label}
    </Badge>
  );
}

export function AlarmStatusBadge({ status }: { status: AlarmStatus }) {
  const map: Record<AlarmStatus, { label: string; class: string }> = {
    OPEN: { label: "Open", class: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
    ACKNOWLEDGED: { label: "Acked", class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
    RESOLVED: { label: "Resolved", class: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    IGNORED: { label: "Ignored", class: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  };
  const cfg = map[status] ?? map.OPEN;
  return (
    <Badge variant="secondary" className={cn("text-xs font-medium", cfg.class)}>
      {cfg.label}
    </Badge>
  );
}
