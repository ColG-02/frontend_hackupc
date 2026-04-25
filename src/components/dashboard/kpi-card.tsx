import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: "default" | "green" | "yellow" | "orange" | "red" | "purple" | "blue" | "gray";
  subtitle?: string;
  isLoading?: boolean;
}

const COLOR_MAP = {
  default: "text-foreground bg-muted",
  green: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  yellow: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30",
  orange: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30",
  red: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
  purple: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
  blue: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
  gray: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800",
};

export function KpiCard({ title, value, icon: Icon, color = "default", subtitle, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn("rounded-md p-2", COLOR_MAP[color])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
