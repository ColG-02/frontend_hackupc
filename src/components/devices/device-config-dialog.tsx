"use client";

import { FormEvent, ReactElement, useState } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { DeviceConfig } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cloneDeviceConfig, DEFAULT_DEVICE_CONFIG } from "@/lib/device-config";
import { updateDeviceConfig } from "@/lib/api/client";

interface Props {
  deviceId: string;
  initialConfig?: DeviceConfig;
  trigger?: ReactElement;
  onSaved?: () => void | Promise<void>;
}

type ThresholdKey = keyof DeviceConfig["thresholds"];
type CalibrationKey = keyof DeviceConfig["calibration"];

const thresholdFields: Array<{ key: ThresholdKey; label: string; step?: string; min?: number; max?: number }> = [
  { key: "near_full_pct", label: "Near full (%)", min: 0, max: 100 },
  { key: "full_pct", label: "Full (%)", min: 0, max: 100 },
  { key: "critical_pct", label: "Critical (%)", min: 0, max: 100 },
  { key: "garbage_confidence", label: "Garbage confidence", step: "0.01", min: 0, max: 1 },
  { key: "garbage_frames_required", label: "Garbage frames required", min: 1 },
  { key: "garbage_window_frames", label: "Garbage window frames", min: 1 },
  { key: "clear_frames_required", label: "Clear frames required", min: 1 },
];

const calibrationFields: Array<{ key: CalibrationKey; label: string; step?: string; min?: number }> = [
  { key: "empty_distance_cm", label: "Empty distance (cm)", min: 0 },
  { key: "full_distance_cm", label: "Full distance (cm)", min: 0 },
  { key: "empty_weight_kg", label: "Empty weight (kg)", min: 0 },
  { key: "max_payload_kg", label: "Max payload (kg)", min: 0 },
];

function ConfigNumberInput({
  id,
  label,
  value,
  onChange,
  step = "1",
  min,
  max,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step}
        min={min}
        max={max}
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function DeviceConfigDialog({ deviceId, initialConfig, trigger, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DeviceConfig>(() =>
    cloneDeviceConfig(initialConfig ?? DEFAULT_DEVICE_CONFIG)
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm(cloneDeviceConfig(initialConfig ?? DEFAULT_DEVICE_CONFIG));
    }
    setOpen(nextOpen);
  };

  const updateRoot = <K extends keyof DeviceConfig>(field: K, value: DeviceConfig[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateThreshold = (field: ThresholdKey, value: number) => {
    setForm((current) => ({
      ...current,
      thresholds: { ...current.thresholds, [field]: value },
    }));
  };

  const updateCalibration = (field: CalibrationKey, value: number) => {
    setForm((current) => ({
      ...current,
      calibration: { ...current.calibration, [field]: value },
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      form.thresholds.near_full_pct > form.thresholds.full_pct ||
      form.thresholds.full_pct > form.thresholds.critical_pct
    ) {
      toast.error("Fill thresholds must increase from near full to critical");
      return;
    }

    setSaving(true);
    try {
      const result = await updateDeviceConfig(deviceId, form);
      toast.success(`Device config saved as revision ${result.config_revision}`);
      setOpen(false);
      await onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save device config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline" size="sm" onClick={(event) => event.stopPropagation()} />
          )
        }
      >
        <Settings2 className="h-4 w-4" />
        Configure
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Device Config</DialogTitle>
          <p className="font-mono text-xs text-muted-foreground">{deviceId}</p>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <section className="grid gap-4 md:grid-cols-2">
            <ConfigNumberInput
              id={`${deviceId}-telemetry`}
              label="Telemetry interval (sec)"
              min={1}
              value={form.telemetry_interval_sec}
              onChange={(value) => updateRoot("telemetry_interval_sec", value)}
            />
            <ConfigNumberInput
              id={`${deviceId}-heartbeat`}
              label="Heartbeat interval (sec)"
              min={1}
              value={form.heartbeat_interval_sec}
              onChange={(value) => updateRoot("heartbeat_interval_sec", value)}
            />
            <ConfigNumberInput
              id={`${deviceId}-camera`}
              label="Camera inference (ms)"
              min={1}
              value={form.camera_inference_interval_ms}
              onChange={(value) => updateRoot("camera_inference_interval_ms", value)}
            />
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor={`${deviceId}-upload-images`}>Upload event images</Label>
              <Switch
                id={`${deviceId}-upload-images`}
                checked={form.upload_event_images}
                onCheckedChange={(checked) => updateRoot("upload_event_images", Boolean(checked))}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Thresholds</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {thresholdFields.map((field) => (
                <ConfigNumberInput
                  key={field.key}
                  id={`${deviceId}-${field.key}`}
                  label={field.label}
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  value={form.thresholds[field.key]}
                  onChange={(value) => updateThreshold(field.key, value)}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Calibration</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {calibrationFields.map((field) => (
                <ConfigNumberInput
                  key={field.key}
                  id={`${deviceId}-${field.key}`}
                  label={field.label}
                  step={field.step}
                  min={field.min}
                  value={form.calibration[field.key]}
                  onChange={(value) => updateCalibration(field.key, value)}
                />
              ))}
            </div>
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save config"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
