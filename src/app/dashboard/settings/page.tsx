"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { AppSettings } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getSettings, updateSettings } from "@/lib/api/client";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (field: keyof AppSettings, value: unknown) => {
    setSettings((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="py-20 text-center text-muted-foreground">Loading settings…</div>;
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Settings</h1>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Tabs defaultValue="thresholds">
        <TabsList>
          <TabsTrigger value="thresholds">Alert Thresholds</TabsTrigger>
          <TabsTrigger value="device">Device</TabsTrigger>
          <TabsTrigger value="routing">Routing</TabsTrigger>
          <TabsTrigger value="api">API / Server</TabsTrigger>
        </TabsList>

        {/* Alert Thresholds */}
        <TabsContent value="thresholds" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Fill Thresholds</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Near Full Threshold (%)", field: "fill_near_full_threshold" as const },
                { label: "Full Threshold (%)", field: "fill_full_threshold" as const },
                { label: "Critical Threshold (%)", field: "fill_critical_threshold" as const },
              ].map(({ label, field }) => (
                <div key={field} className="flex items-center gap-4">
                  <Label className="w-48 text-sm">{label}</Label>
                  <Input
                    type="number"
                    className="w-24"
                    value={settings[field] as number}
                    onChange={(e) => update(field, Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Alert Types</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Garbage Detection Alerts</Label>
                <Switch
                  checked={settings.garbage_detection_alert_enabled}
                  onCheckedChange={(c) => update("garbage_detection_alert_enabled", c)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="text-sm">Flame Detection Alerts</Label>
                <Switch
                  checked={settings.flame_alert_enabled}
                  onCheckedChange={(c) => update("flame_alert_enabled", c)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Device */}
        <TabsContent value="device" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Device Timeouts</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm">Offline Timeout (min)</Label>
                <Input
                  type="number"
                  className="w-24"
                  value={settings.offline_timeout_minutes}
                  onChange={(e) => update("offline_timeout_minutes", Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm">Telemetry Freshness (min)</Label>
                <Input
                  type="number"
                  className="w-24"
                  value={settings.default_telemetry_freshness_timeout}
                  onChange={(e) => update("default_telemetry_freshness_timeout", Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm">Crew GPS Interval (s)</Label>
                <Input
                  type="number"
                  className="w-24"
                  value={settings.crew_gps_update_interval}
                  onChange={(e) => update("crew_gps_update_interval", Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routing */}
        <TabsContent value="routing" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Route Planning Defaults</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm">Service Time per Stop (min)</Label>
                <Input
                  type="number"
                  className="w-24"
                  value={settings.default_service_time_per_container}
                  onChange={(e) => update("default_service_time_per_container", Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API */}
        <TabsContent value="api" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Backend Connection</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Mock Mode Active</Label>
                <Switch checked={settings.mock_mode} disabled />
              </div>
              <p className="text-xs text-muted-foreground">
                To disable mock mode, set NEXT_PUBLIC_USE_MOCK_API=false in your environment.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
