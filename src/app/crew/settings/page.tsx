"use client";

import { useRouter } from "next/navigation";
import { LogOut, MapPin, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function CrewSettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    toast.info("Signed out");
    router.push("/login");
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="pt-2">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      {/* Preferences */}
      <Card>
        <CardContent className="divide-y p-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
              <Label className="text-sm font-normal">Dark Mode</Label>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(c) => setTheme(c ? "dark" : "light")}
            />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-normal">GPS Sharing</Label>
                <p className="text-xs text-muted-foreground">
                  Location shared while on duty
                </p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Signed in as</p>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Role: {user?.role}</p>
          </div>
          <Separator />
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* GPS instructions */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            GPS PERMISSION INSTRUCTIONS
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If GPS is not working, open your browser settings and allow location
            access for this site. On mobile, ensure Location Services are enabled
            in your device settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
