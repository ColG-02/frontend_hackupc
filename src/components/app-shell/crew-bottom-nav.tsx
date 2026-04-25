"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Navigation, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/crew", label: "Today", icon: Home, exact: true },
  { href: "/crew/route", label: "Route", icon: Map },
  { href: "/crew/stops", label: "Stops", icon: Navigation },
  { href: "/crew/settings", label: "Settings", icon: Settings },
];

export function CrewBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex h-16 items-center justify-around border-t bg-background safe-bottom">
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", active && "text-primary")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
