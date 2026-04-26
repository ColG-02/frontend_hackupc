import { DeviceConfig } from "@/types";

export const DEFAULT_DEVICE_CONFIG: DeviceConfig = {
  telemetry_interval_sec: 60,
  heartbeat_interval_sec: 60,
  camera_inference_interval_ms: 2000,
  upload_event_images: true,
  thresholds: {
    near_full_pct: 70,
    full_pct: 85,
    critical_pct: 95,
    garbage_confidence: 0.65,
    garbage_frames_required: 3,
    garbage_window_frames: 5,
    clear_frames_required: 5,
  },
  calibration: {
    empty_distance_cm: 130,
    full_distance_cm: 20,
    empty_weight_kg: 40,
    max_payload_kg: 400,
  },
};

export function cloneDeviceConfig(config: DeviceConfig = DEFAULT_DEVICE_CONFIG): DeviceConfig {
  return {
    ...config,
    thresholds: { ...config.thresholds },
    calibration: { ...config.calibration },
  };
}
