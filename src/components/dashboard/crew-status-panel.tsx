"use client";

import { useRouter } from "next/navigation";
import { CleaningCrew } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatApiDistanceToNow } from "@/lib/dates";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  ON_DUTY: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  IN_ROUTE: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  AT_STOP: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  ON_BREAK: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  OFF_DUTY: "bg-gray-100 text-gray-500 dark:bg-gray-800",
  UNKNOWN: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<string, string> = {
  ON_DUTY: "On Duty",
  IN_ROUTE: "In Route",
  AT_STOP: "At Stop",
  ON_BREAK: "On Break",
  OFF_DUTY: "Off Duty",
  UNKNOWN: "Unknown",
};

interface Props {
  crews: CleaningCrew[];
  isLoading?: boolean;
}

export function CrewStatusPanel({ crews, isLoading }: Props) {
  const router = useRouter();
  const onDuty = crews.filter((c) => c.status !== "OFF_DUTY");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Crews on Duty ({onDuty.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}
        {!isLoading && crews.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">No crews on duty</div>
        )}
        <ul className="divide-y">
          {crews
            .sort((a, b) => {
              const order = { IN_ROUTE: 0, AT_STOP: 1, ON_DUTY: 2, ON_BREAK: 3, OFF_DUTY: 4, UNKNOWN: 5 };
              return (order[a.status] ?? 5) - (order[b.status] ?? 5);
            })
            .map((crew) => (
              <li
                key={crew.crew_id}
                className="cursor-pointer px-4 py-3 hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/dashboard/crews/${crew.crew_id}`)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{crew.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {crew.vehicle_id && <span>{crew.vehicle_id} · </span>}
                      {crew.members_count} member{crew.members_count !== 1 ? "s" : ""}
                      {crew.current_location && (
                        <span>
                          {" · "}GPS{" "}
                          {formatApiDistanceToNow(crew.current_location.updated_at)}
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs shrink-0", STATUS_COLOR[crew.status] ?? "")}
                  >
                    {STATUS_LABEL[crew.status] ?? crew.status}
                  </Badge>
                </div>
              </li>
            ))}
        </ul>
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => router.push("/dashboard/crews")}
          >
            View all crews →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
