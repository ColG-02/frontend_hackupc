import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Props {
  pct: number;
  className?: string;
  showLabel?: boolean;
}

function getColor(pct: number): string {
  if (pct >= 95) return "bg-red-500";
  if (pct >= 85) return "bg-orange-500";
  if (pct >= 70) return "bg-yellow-500";
  return "bg-green-500";
}

export function FillProgress({ pct, className, showLabel = true }: Props) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress
        value={pct}
        className="flex-1 h-2"
        style={{ "--progress-color": getColor(pct) } as React.CSSProperties}
      />
      {showLabel && (
        <span className="text-sm font-medium tabular-nums w-10 text-right">
          {pct.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
