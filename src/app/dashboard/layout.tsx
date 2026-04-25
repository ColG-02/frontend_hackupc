"use client";

import { useCallback } from "react";
import { DashboardSidebar } from "@/components/app-shell/dashboard-sidebar";
import { DashboardHeader } from "@/components/app-shell/dashboard-header";
import { RoleGuard } from "@/components/app-shell/role-guard";
import { usePolling } from "@/hooks/use-polling";
import { getAlarms } from "@/lib/api/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const fetchOpenAlarms = useCallback(
    () => getAlarms({ status: "OPEN" }).then((r) => r.items.length),
    []
  );
  const { data: openAlarmCount } = usePolling(fetchOpenAlarms, 30_000);

  return (
    <RoleGuard allowedRoles={["ADMIN", "DISPATCHER", "VIEWER"]}>
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader openAlarms={openAlarmCount ?? 0} />
          <main className="flex-1 overflow-auto bg-muted/30 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
