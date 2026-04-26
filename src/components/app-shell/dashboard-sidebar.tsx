"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Cpu,
  Map,
  Settings,
  Trash2,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: BarChart3, exact: true },
  { href: "/dashboard/map", label: "Map", icon: Map },
  { href: "/dashboard/containers", label: "Containers", icon: Trash2 },
  { href: "/dashboard/devices", label: "Devices", icon: Cpu },
  { href: "/dashboard/alarms", label: "Alarms", icon: AlertTriangle },
  { href: "/dashboard/routes", label: "Routes", icon: Map },
  { href: "/dashboard/crews", label: "Crews", icon: Users },
  { href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-sidebar-foreground">SmartWaste</p>
          <p className="text-[10px] text-muted-foreground">Operations</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Crew shortcut */}
      <div className="border-t p-2">
        <Link
          href="/crew"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Truck className="h-4 w-4 shrink-0" />
          Crew View
        </Link>
      </div>
    </aside>
  );
}
