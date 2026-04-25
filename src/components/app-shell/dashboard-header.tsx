"use client";

import { Bell, LogOut, Search, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  DISPATCHER: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  VIEWER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  CREW: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

interface Props {
  openAlarms?: number;
}

export function DashboardHeader({ openAlarms = 0 }: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4">
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search containers, crews…"
          className="pl-8 h-8 text-sm"
          aria-label="Search"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Alarm bell */}
        <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/dashboard/alarms")}>
          <Bell className="h-4 w-4" />
          {openAlarms > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {openAlarms > 9 ? "9+" : openAlarms}
            </span>
          )}
        </Button>

        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">{user?.name ?? user?.email}</span>
            {user && (
              <Badge className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[user.role] ?? ""}`} variant="secondary">
                {user.role}
              </Badge>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
