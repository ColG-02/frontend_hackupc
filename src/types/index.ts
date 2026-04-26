// ── Enums ─────────────────────────────────────────────────────────────────────

export type FillState = "EMPTY" | "NORMAL" | "NEAR_FULL" | "FULL" | "CRITICAL" | "UNKNOWN";
export type CameraState = "EVERYTHING_OK" | "GARBAGE_DETECTED" | "UNKNOWN" | "CAMERA_FAULT";
export type DeviceStatus = "ONLINE" | "OFFLINE" | "DEGRADED" | "FAULT" | "MAINTENANCE" | "UNKNOWN";
export type ContainerStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type ContainerType = "UNDERGROUND" | "ABOVE_GROUND";

export type AlarmSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlarmStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "IGNORED";
export type AlarmType =
  | "GARBAGE_DETECTED"
  | "GARBAGE_CLEARED"
  | "FULL_THRESHOLD"
  | "CRITICAL_FULL"
  | "FLAME_DETECTED"
  | "FLAME_CLEARED"
  | "SENSOR_FAULT"
  | "CAMERA_FAULT"
  | "LOW_POWER"
  | "DEVICE_OFFLINE"
  | "DEVICE_ONLINE"
  | "MAINTENANCE_REQUIRED"
  | "COLLECTION_CONFIRMED";

export type CrewStatus =
  | "ON_DUTY"
  | "OFF_DUTY"
  | "ON_BREAK"
  | "IN_ROUTE"
  | "AT_STOP"
  | "UNKNOWN";

export type RoutePlanStatus = "PLANNED" | "DISPATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type RouteStatus = "PLANNED" | "DISPATCHED" | "IN_PROGRESS" | "COMPLETED";
export type StopStatus = "PENDING" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "FAILED";

export type MaintenanceType =
  | "SENSOR_FAULT"
  | "CAMERA_FAULT"
  | "FLAME_SENSOR_FAULT"
  | "LOW_POWER"
  | "PHYSICAL_DAMAGE"
  | "CALIBRATION_REQUIRED"
  | "OTHER";
export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MaintenanceStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";

export type UserRole = "ADMIN" | "DISPATCHER" | "VIEWER" | "CREW";

// ── Core models ───────────────────────────────────────────────────────────────

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface ContainerCapacity {
  volume_l?: number;
  max_payload_kg?: number;
}

export interface ContainerLatestState {
  last_seen_at?: string;
  fused_fill_pct?: number;
  fill_state?: FillState;
  camera_state?: CameraState;
  camera_confidence?: number;
  flame_detected?: boolean;
  flame_intensity_pct?: number;
  temperature_c?: number;
  humidity_pct?: number;
  light_lux?: number;
  weight_kg?: number;
  ultrasonic_distance_cm?: number;
  device_status?: DeviceStatus;
}

export interface Container {
  container_id: string;
  name: string;
  site_id?: string;
  address?: string;
  location?: GeoPoint;
  status: ContainerStatus;
  container_type?: ContainerType;
  capacity?: ContainerCapacity;
  assigned_device_id?: string;
  latest_state: ContainerLatestState;
  config_revision?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DeviceFirmware {
  mcu_version: string;
  linux_app_version: string;
  model_id: string;
}

export interface DeviceCapabilities {
  sensors: string[];
  camera: boolean;
  offline_buffer: boolean;
}

export interface DeviceHealth {
  rssi_dbm?: number;
  uptime_sec?: number;
  free_disk_mb?: number;
  offline_queue_count?: number;
}

export interface Device {
  device_id: string;
  factory_device_id?: string;
  claim_code?: string;
  container_id?: string | null;
  status: DeviceStatus;
  last_seen_at?: string;
  created_at?: string;
  updated_at?: string;
  firmware?: DeviceFirmware;
  capabilities?: DeviceCapabilities;
  health?: DeviceHealth;
}

export interface DeviceBootstrapPayload {
  schema_version: "1.0";
  factory_device_id: string;
  claim_code: string;
  firmware: DeviceFirmware;
  capabilities: DeviceCapabilities;
}

export interface DeviceBootstrapResponse {
  accepted: boolean;
  device_id: string;
  container_id?: string;
  device_token: string;
  server_time: string;
  config_revision: number;
  config?: {
    telemetry_interval_sec: number;
    heartbeat_interval_sec: number;
    camera_inference_interval_ms: number;
    upload_event_images: boolean;
    thresholds?: Record<string, number>;
    calibration?: Record<string, number>;
  };
}

export interface TelemetryPoint {
  ts: string;
  temperature_c?: number;
  humidity_pct?: number;
  light_lux?: number;
  ultrasonic_distance_cm?: number;
  weight_kg?: number;
  fused_fill_pct?: number;
  fill_state?: FillState;
  camera_state?: CameraState;
  camera_confidence?: number;
  flame_detected?: boolean;
  flame_intensity_pct?: number;
  rssi_dbm?: number;
  uptime_sec?: number;
}

export interface AlarmEvent {
  event_id: string;
  container_id: string;
  device_id?: string;
  type: AlarmType;
  severity: AlarmSeverity;
  status: AlarmStatus;
  started_at: string;
  ended_at?: string | null;
  confidence?: number;
  summary: string;
  media_ids?: string[];
  location?: { lat: number; lng: number };
}

export interface CrewLocation {
  lat: number;
  lng: number;
  accuracy_m?: number;
  heading_deg?: number;
  speed_mps?: number;
  updated_at: string;
}

export interface CleaningCrew {
  crew_id: string;
  name: string;
  status: CrewStatus;
  members_count: number;
  vehicle_id?: string;
  phone?: string;
  current_location?: CrewLocation;
  assigned_route_plan_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RouteStop {
  stop_id: string;
  order: number;
  container_id: string;
  container_name?: string;
  address?: string;
  location: { lat: number; lng: number };
  eta?: string;
  service_time_min?: number;
  priority_score?: number;
  reason: string[];
  status: StopStatus;
  fill_pct?: number;
  fill_state?: FillState;
  camera_state?: CameraState;
  alarm_types?: AlarmType[];
  notes?: string;
}

export interface CrewRoute {
  route_id?: string;
  crew_id?: string;
  vehicle_id?: string;
  status?: RouteStatus;
  estimated_distance_km?: number;
  estimated_duration_min?: number;
  polyline?: [number, number][];
  stops: RouteStop[];
}

export interface RoutePlanSummary {
  vehicles_used: number;
  stops: number;
  estimated_distance_km?: number;
  estimated_duration_min?: number;
  completed_stops?: number;
  remaining_stops?: number;
}

export interface RoutePlan {
  route_plan_id: string;
  date: string;
  status: RoutePlanStatus;
  summary: RoutePlanSummary;
  routes: CrewRoute[];
  created_at?: string;
  dispatched_at?: string;
  dispatched_by?: string;
}

export interface MaintenanceTicket {
  ticket_id: string;
  container_id: string;
  device_id?: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  description: string;
  created_at: string;
  updated_at?: string;
  assigned_to?: string;
}

export interface DashboardSummary {
  containers_total: number;
  containers_near_full: number;
  containers_full: number;
  containers_critical: number;
  open_alarms: number;
  critical_alarms: number;
  crews_on_duty: number;
  active_route_plans: number;
  open_tickets: number;
  updated_at: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  user_id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

// ── API request/response types ────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface CrewLocationPayload {
  crew_id: string;
  route_plan_id?: string;
  lat: number;
  lng: number;
  accuracy_m?: number;
  heading_deg?: number;
  speed_mps?: number;
  recorded_at: string;
  battery_level?: number;
}

export interface AppSettings {
  fill_near_full_threshold: number;
  fill_full_threshold: number;
  fill_critical_threshold: number;
  garbage_detection_alert_enabled: boolean;
  flame_alert_enabled: boolean;
  offline_timeout_minutes: number;
  default_telemetry_freshness_timeout: number;
  default_route_start_depot?: string;
  default_service_time_per_container: number;
  crew_gps_update_interval: number;
  map_provider: string;
  mock_mode: boolean;
}
