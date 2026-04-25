"use client";

import { RoleGuard } from "@/components/app-shell/role-guard";
import { CrewBottomNav } from "@/components/app-shell/crew-bottom-nav";
import { useAuth } from "@/lib/auth/context";

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["CREW", "ADMIN"]}>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="h-14 shrink-0 flex items-center justify-between border-b bg-background px-4">
          <div>
            <p className="text-sm font-semibold">{user?.name ?? "Crew"}</p>
            <p className="text-xs text-muted-foreground">Field Operations</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">GPS</span>
          </div>
        </header>

        {/* Main content with bottom nav padding */}
        <main className="flex-1 overflow-auto pb-16">
          {children}
        </main>

        <CrewBottomNav />
      </div>
    </RoleGuard>
  );
}
