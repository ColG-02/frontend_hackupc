/**
 * Typed API client. When NEXT_PUBLIC_USE_MOCK_API=true (the default),
 * all functions return mock data. Replace the mock branches with real
 * fetch calls once the backend is running.
 */

import {
  AlarmEvent,
  AlarmStatus,
  AppSettings,
  AuthTokens,
  CleaningCrew,
  Container,
  CrewLocation,
  CrewLocationPayload,
  DashboardSummary,
  Device,
  DeviceBootstrapPayload,
  DeviceBootstrapResponse,
  MaintenanceTicket,
  RoutePlan,
  TelemetryPoint,
  User,
} from "@/types";
import {
  MOCK_ALARMS,
  MOCK_CONTAINERS,
  MOCK_CREWS,
  MOCK_DEVICES,
  MOCK_MAINTENANCE_TICKETS,
  MOCK_ROUTE_PLANS,
  buildMockDashboardSummary,
  generateMockTelemetry,
} from "@/lib/mock-data";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Token storage ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "auth_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function storeToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

function decodeJwtPayload(token: string): { sub: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as Record<string, unknown>;
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub, role: String(payload.role ?? "VIEWER") };
  } catch {
    return null;
  }
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function http<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err?.detail?.message ?? err?.detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Mock delay ─────────────────────────────────────────────────────────────────

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ── Demo users ─────────────────────────────────────────────────────────────────

const DEMO_USERS: Record<string, User & { password: string }> = {
  "dispatcher@smart-waste.local": {
    user_id: "usr-dispatcher",
    email: "dispatcher@smart-waste.local",
    name: "Demo Dispatcher",
    role: "DISPATCHER",
    password: "dispatcher123",
  },
  "admin@smart-waste.local": {
    user_id: "usr-admin",
    email: "admin@smart-waste.local",
    name: "Demo Admin",
    role: "ADMIN",
    password: "admin-change-this",
  },
  "crew@smart-waste.local": {
    user_id: "usr-crew",
    email: "crew@smart-waste.local",
    name: "Alpha Team Lead",
    role: "CREW",
    password: "crew123",
  },
};

let _mockCurrentUser: User | null = null;
const MOCK_USER_KEY = "mock_user";

function loadMockUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MOCK_USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

function saveMockUser(user: User) {
  if (typeof window !== "undefined")
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  _mockCurrentUser = user;
}

function clearMockUser() {
  if (typeof window !== "undefined") localStorage.removeItem(MOCK_USER_KEY);
  _mockCurrentUser = null;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<{ user: User; tokens: AuthTokens }> {
  if (USE_MOCK) {
    await delay();
    const demo = DEMO_USERS[email];
    if (!demo || demo.password !== password) {
      throw new Error("Incorrect email or password.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...user } = demo;
    saveMockUser(user);
    storeToken("mock-token-" + user.user_id);
    return {
      user,
      tokens: { access_token: "mock-token", token_type: "bearer" },
    };
  }
  const tokens = await http<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  storeToken(tokens.access_token);
  const payload = decodeJwtPayload(tokens.access_token);
  const user: User = {
    user_id: payload?.sub ?? "",
    email,
    name: email.split("@")[0],
    role: (payload?.role ?? "VIEWER") as User["role"],
  };
  saveMockUser(user);
  return { user, tokens };
}

export async function logout(): Promise<void> {
  clearToken();
  clearMockUser();
}

export async function getCurrentUser(): Promise<User> {
  if (USE_MOCK) {
    await delay(100);
    const u = _mockCurrentUser ?? loadMockUser();
    if (!u) throw new Error("Not authenticated");
    _mockCurrentUser = u;
    return u;
  }
  // Real mode: user was saved to localStorage at login; fall back to JWT decode
  const stored = loadMockUser();
  if (stored) return stored;
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated");
  const payload = decodeJwtPayload(token);
  if (!payload?.sub) throw new Error("Not authenticated");
  return {
    user_id: payload.sub,
    email: "",
    name: "User",
    role: payload.role as User["role"],
  };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (USE_MOCK) {
    await delay(300);
    return buildMockDashboardSummary();
  }
  return http<DashboardSummary>("/dashboard/summary");
}

// ── Containers ────────────────────────────────────────────────────────────────

export interface ContainerFilters {
  status?: string;
  fill_state?: string;
  camera_state?: string;
  site_id?: string;
  limit?: number;
  offset?: number;
}

export async function getContainers(
  filters: ContainerFilters = {}
): Promise<{ items: Container[]; total: number }> {
  if (USE_MOCK) {
    await delay(300);
    let items = [...MOCK_CONTAINERS];
    if (filters.status) items = items.filter((c) => c.status === filters.status);
    if (filters.fill_state)
      items = items.filter(
        (c) => c.latest_state.fill_state === filters.fill_state
      );
    if (filters.camera_state)
      items = items.filter(
        (c) => c.latest_state.camera_state === filters.camera_state
      );
    if (filters.site_id)
      items = items.filter((c) => c.site_id === filters.site_id);
    return { items, total: items.length };
  }
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.fill_state) params.set("fill_state", filters.fill_state);
  if (filters.camera_state) params.set("camera_state", filters.camera_state);
  if (filters.site_id) params.set("site_id", filters.site_id);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));
  return http(`/containers?${params}`);
}

export async function getContainer(containerId: string): Promise<Container> {
  if (USE_MOCK) {
    await delay(200);
    const c = MOCK_CONTAINERS.find((c) => c.container_id === containerId);
    if (!c) throw new Error("Container not found");
    return c;
  }
  return http<Container>(`/containers/${containerId}`);
}

export async function getContainerTelemetry(
  containerId: string,
  fromDate: string,
  toDate: string,
  interval = "raw"
): Promise<TelemetryPoint[]> {
  if (USE_MOCK) {
    await delay(400);
    return generateMockTelemetry(containerId, 24);
  }
  const params = new URLSearchParams({ from: fromDate, to: toDate, interval });
  const res = await http<{ items: TelemetryPoint[] }>(
    `/containers/${containerId}/telemetry?${params}`
  );
  return res.items;
}

export async function createContainer(data: Partial<Container>): Promise<{ container_id: string }> {
  if (USE_MOCK) {
    await delay(500);
    const containerId = data.container_id ?? "cont-new-" + Date.now();
    if (MOCK_CONTAINERS.some((container) => container.container_id === containerId)) {
      throw new Error("Container ID already exists.");
    }
    const container: Container = {
      container_id: containerId,
      name: data.name ?? containerId,
      site_id: data.site_id,
      address: data.address,
      location: data.location,
      status: data.status ?? "ACTIVE",
      container_type: data.container_type ?? "UNDERGROUND",
      capacity: data.capacity,
      assigned_device_id: data.assigned_device_id,
      latest_state: {
        fill_state: "UNKNOWN",
        camera_state: "UNKNOWN",
        device_status: "UNKNOWN",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_CONTAINERS.unshift(container);
    return { container_id: containerId };
  }
  return http("/containers", { method: "POST", body: JSON.stringify(data) });
}

export async function createDeviceClaimCode(data: {
  container_id: string;
  code: string;
}): Promise<{ created?: boolean; container_id: string }> {
  if (USE_MOCK) {
    await delay(300);
    const container = MOCK_CONTAINERS.find((item) => item.container_id === data.container_id);
    if (!container) throw new Error("Container not found");
    return { created: true, container_id: data.container_id };
  }
  return http("/devices/claim-codes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateContainer(
  containerId: string,
  data: Partial<Container>
): Promise<void> {
  if (USE_MOCK) { await delay(400); return; }
  await http(`/containers/${containerId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Device provisioning

export async function getDevices(): Promise<{ items: Device[]; total: number }> {
  if (USE_MOCK) {
    await delay(300);
    return { items: [...MOCK_DEVICES], total: MOCK_DEVICES.length };
  }
  return http<{ items: Device[]; total: number }>("/devices");
}

export async function bootstrapDevice(
  data: DeviceBootstrapPayload
): Promise<DeviceBootstrapResponse> {
  if (USE_MOCK) {
    await delay(500);
    if (MOCK_DEVICES.some((device) => device.factory_device_id === data.factory_device_id)) {
      throw new Error("This factory device ID has already been claimed.");
    }
    const sequence = String(MOCK_DEVICES.length + 1).padStart(3, "0");
    const deviceId = `cont-${Date.now().toString().slice(-6)}`;
    const device: Device = {
      device_id: deviceId,
      factory_device_id: data.factory_device_id,
      container_id: null,
      status: "UNKNOWN",
      created_at: new Date().toISOString(),
      firmware: data.firmware,
      capabilities: data.capabilities,
    };
    MOCK_DEVICES.unshift(device);
    return {
      accepted: true,
      device_id: deviceId,
      container_id: `bin-new-${sequence}`,
      device_token: `dev-token-${sequence}`,
      server_time: new Date().toISOString(),
      config_revision: 1,
      config: {
        telemetry_interval_sec: 60,
        heartbeat_interval_sec: 60,
        camera_inference_interval_ms: 2000,
        upload_event_images: true,
      },
    };
  }
  return http<DeviceBootstrapResponse>("/device/bootstrap", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function assignDeviceToContainer(
  deviceId: string,
  containerId: string
): Promise<{ assigned: boolean; device_id: string; container_id: string }> {
  if (USE_MOCK) {
    await delay(300);
    const device = MOCK_DEVICES.find((item) => item.device_id === deviceId);
    const container = MOCK_CONTAINERS.find((item) => item.container_id === containerId);
    if (!device) throw new Error("Device not found");
    if (!container) throw new Error("Container not found");
    device.container_id = containerId;
    device.updated_at = new Date().toISOString();
    container.assigned_device_id = deviceId;
    container.updated_at = device.updated_at;
    return { assigned: true, device_id: deviceId, container_id: containerId };
  }
  return http(`/devices/${deviceId}/assign`, {
    method: "POST",
    body: JSON.stringify({ container_id: containerId }),
  });
}

// ── Alarms ─────────────────────────────────────────────────────────────────────

export interface AlarmFilters {
  severity?: string;
  status?: string;
  type?: string;
  container_id?: string;
  limit?: number;
  offset?: number;
}

export async function getAlarms(
  filters: AlarmFilters = {}
): Promise<{ items: AlarmEvent[]; total: number }> {
  if (USE_MOCK) {
    await delay(300);
    let items = [...MOCK_ALARMS];
    if (filters.severity) items = items.filter((a) => a.severity === filters.severity);
    if (filters.status) items = items.filter((a) => a.status === filters.status);
    if (filters.type) items = items.filter((a) => a.type === filters.type);
    if (filters.container_id) items = items.filter((a) => a.container_id === filters.container_id);
    return { items, total: items.length };
  }
  const params = new URLSearchParams();
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.container_id) params.set("container_id", filters.container_id);
  return http(`/events?${params}`);
}

export async function getAlarm(eventId: string): Promise<AlarmEvent> {
  if (USE_MOCK) {
    await delay(200);
    const a = MOCK_ALARMS.find((a) => a.event_id === eventId);
    if (!a) throw new Error("Alarm not found");
    return a;
  }
  return http<AlarmEvent>(`/events/${eventId}`);
}

export async function acknowledgeAlarm(eventId: string, note?: string): Promise<void> {
  if (USE_MOCK) {
    await delay(300);
    const alarm = MOCK_ALARMS.find((a) => a.event_id === eventId);
    if (alarm) alarm.status = "ACKNOWLEDGED";
    return;
  }
  await http(`/events/${eventId}/acknowledge`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function resolveAlarm(eventId: string, resolution?: string): Promise<void> {
  if (USE_MOCK) {
    await delay(300);
    const alarm = MOCK_ALARMS.find((a) => a.event_id === eventId);
    if (alarm) { alarm.status = "RESOLVED"; alarm.ended_at = new Date().toISOString(); }
    return;
  }
  await http(`/events/${eventId}/resolve`, {
    method: "POST",
    body: JSON.stringify({ resolution }),
  });
}

export async function ignoreAlarm(eventId: string, reason?: string): Promise<void> {
  if (USE_MOCK) {
    await delay(300);
    const alarm = MOCK_ALARMS.find((a) => a.event_id === eventId);
    if (alarm) alarm.status = "IGNORED";
    return;
  }
  await http(`/events/${eventId}/ignore`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// ── Crews ─────────────────────────────────────────────────────────────────────

export async function getCrews(): Promise<CleaningCrew[]> {
  if (USE_MOCK) { await delay(300); return MOCK_CREWS; }
  const res = await http<{ items: CleaningCrew[] }>("/crews");
  return res.items;
}

export async function getCrew(crewId: string): Promise<CleaningCrew> {
  if (USE_MOCK) {
    await delay(200);
    const c = MOCK_CREWS.find((c) => c.crew_id === crewId);
    if (!c) throw new Error("Crew not found");
    return c;
  }
  return http<CleaningCrew>(`/crews/${crewId}`);
}

export async function getCrewPositions(): Promise<CleaningCrew[]> {
  if (USE_MOCK) {
    await delay(200);
    return MOCK_CREWS.filter((c) => c.current_location);
  }
  // Positions endpoint returns `location` not `current_location`
  type PositionItem = Omit<CleaningCrew, "current_location"> & { location?: CrewLocation };
  const res = await http<{ items: PositionItem[] }>("/crews/positions");
  return res.items.map((item) => ({ ...item, current_location: item.location }));
}

export async function sendCrewLocation(data: CrewLocationPayload): Promise<void> {
  if (USE_MOCK) {
    const crew = MOCK_CREWS.find((c) => c.crew_id === data.crew_id);
    if (crew) {
      crew.current_location = {
        lat: data.lat,
        lng: data.lng,
        accuracy_m: data.accuracy_m,
        heading_deg: data.heading_deg,
        speed_mps: data.speed_mps,
        updated_at: data.recorded_at,
      };
    }
    return;
  }
  await http(`/crews/${data.crew_id}/location`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Routes ─────────────────────────────────────────────────────────────────────

export async function getRoutePlans(): Promise<RoutePlan[]> {
  if (USE_MOCK) { await delay(300); return MOCK_ROUTE_PLANS; }
  // List endpoint returns flat RoutePlanListItem; map to RoutePlan shape
  type ListItem = {
    route_plan_id: string;
    date: string;
    status: RoutePlan["status"];
    vehicles_used: number;
    stops: number;
    estimated_distance_km?: number;
    estimated_duration_min?: number;
  };
  const res = await http<{ items: ListItem[] }>("/routes/plans");
  return res.items.map((item) => ({
    route_plan_id: item.route_plan_id,
    date: item.date,
    status: item.status,
    summary: {
      vehicles_used: item.vehicles_used,
      stops: item.stops,
      estimated_distance_km: item.estimated_distance_km,
      estimated_duration_min: item.estimated_duration_min,
    },
    routes: [],
  }));
}

export async function getRoutePlan(routePlanId: string): Promise<RoutePlan> {
  if (USE_MOCK) {
    await delay(200);
    const p = MOCK_ROUTE_PLANS.find((p) => p.route_plan_id === routePlanId);
    if (!p) throw new Error("Route plan not found");
    return p;
  }
  return http<RoutePlan>(`/routes/plans/${routePlanId}`);
}

export async function createRoutePlan(data: {
  date: string;
  vehicle_ids: string[];
}): Promise<RoutePlan> {
  if (USE_MOCK) {
    await delay(800);
    const plan: RoutePlan = {
      route_plan_id: "plan-new-" + Date.now(),
      date: data.date,
      status: "PLANNED",
      summary: { vehicles_used: data.vehicle_ids.length, stops: 0 },
      routes: [],
      created_at: new Date().toISOString(),
    };
    MOCK_ROUTE_PLANS.unshift(plan);
    return plan;
  }
  return http<RoutePlan>("/routes/plan", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function dispatchRoutePlan(routePlanId: string): Promise<void> {
  if (USE_MOCK) {
    await delay(400);
    const plan = MOCK_ROUTE_PLANS.find((p) => p.route_plan_id === routePlanId);
    if (plan) { plan.status = "DISPATCHED"; plan.dispatched_at = new Date().toISOString(); }
    return;
  }
  await http(`/routes/plans/${routePlanId}/dispatch`, { method: "POST", body: JSON.stringify({}) });
}

export async function updateRouteStop(
  routePlanId: string,
  stopId: string,
  data: { status: string; notes?: string }
): Promise<void> {
  if (USE_MOCK) {
    await delay(300);
    for (const plan of MOCK_ROUTE_PLANS) {
      if (plan.route_plan_id !== routePlanId) continue;
      for (const route of plan.routes) {
        const stop = route.stops.find((s) => s.stop_id === stopId);
        if (stop) {
          (stop as unknown as Record<string, unknown>).status = data.status;
          if (data.notes) stop.notes = data.notes;
        }
      }
    }
    return;
  }
  await http(`/routes/plans/${routePlanId}/stops/${stopId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Maintenance ────────────────────────────────────────────────────────────────

export interface TicketFilters {
  priority?: string;
  status?: string;
  type?: string;
  container_id?: string;
}

export async function getMaintenanceTickets(
  filters: TicketFilters = {}
): Promise<MaintenanceTicket[]> {
  if (USE_MOCK) {
    await delay(300);
    let items = [...MOCK_MAINTENANCE_TICKETS];
    if (filters.priority) items = items.filter((t) => t.priority === filters.priority);
    if (filters.status) items = items.filter((t) => t.status === filters.status);
    if (filters.type) items = items.filter((t) => t.type === filters.type);
    if (filters.container_id) items = items.filter((t) => t.container_id === filters.container_id);
    return items;
  }
  const params = new URLSearchParams(filters as Record<string, string>);
  const res = await http<{ items: MaintenanceTicket[] }>(`/maintenance/tickets?${params}`);
  return res.items;
}

export async function createMaintenanceTicket(
  data: Partial<MaintenanceTicket>
): Promise<MaintenanceTicket> {
  if (USE_MOCK) {
    await delay(500);
    const ticket: MaintenanceTicket = {
      ticket_id: "ticket-" + Date.now(),
      container_id: data.container_id ?? "",
      type: data.type ?? "OTHER",
      priority: data.priority ?? "MEDIUM",
      status: "OPEN",
      description: data.description ?? "",
      created_at: new Date().toISOString(),
    };
    MOCK_MAINTENANCE_TICKETS.unshift(ticket);
    return ticket;
  }
  return http<MaintenanceTicket>("/maintenance/tickets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMaintenanceTicket(
  ticketId: string,
  data: Partial<MaintenanceTicket>
): Promise<void> {
  if (USE_MOCK) {
    await delay(300);
    const ticket = MOCK_MAINTENANCE_TICKETS.find((t) => t.ticket_id === ticketId);
    if (ticket) Object.assign(ticket, data, { updated_at: new Date().toISOString() });
    return;
  }
  await http(`/maintenance/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  fill_near_full_threshold: 70,
  fill_full_threshold: 85,
  fill_critical_threshold: 95,
  garbage_detection_alert_enabled: true,
  flame_alert_enabled: true,
  offline_timeout_minutes: 10,
  default_telemetry_freshness_timeout: 30,
  default_service_time_per_container: 10,
  crew_gps_update_interval: 10,
  map_provider: "openstreetmap",
  mock_mode: USE_MOCK,
};

export async function getSettings(): Promise<AppSettings> {
  if (USE_MOCK) { await delay(200); return DEFAULT_SETTINGS; }
  return http<AppSettings>("/settings");
}

export async function updateSettings(data: Partial<AppSettings>): Promise<void> {
  if (USE_MOCK) { await delay(300); return; }
  await http("/settings", { method: "PATCH", body: JSON.stringify(data) });
}

// ── SSE real-time ─────────────────────────────────────────────────────────────

export function createOperationsStream(
  onEvent: (type: string, data: unknown) => void
): () => void {
  if (USE_MOCK) return () => {};
  const token = getStoredToken();
  const url = `${BASE_URL}/realtime/operations`;
  const es = new EventSource(url + (token ? `?token=${token}` : ""));
  es.onmessage = (e) => {
    try { onEvent("message", JSON.parse(e.data)); } catch { /* ignore */ }
  };
  es.addEventListener("crew.location.updated", (e) =>
    onEvent("crew.location.updated", JSON.parse((e as MessageEvent).data))
  );
  es.addEventListener("alarm.created", (e) =>
    onEvent("alarm.created", JSON.parse((e as MessageEvent).data))
  );
  es.addEventListener("alarm.updated", (e) =>
    onEvent("alarm.updated", JSON.parse((e as MessageEvent).data))
  );
  return () => es.close();
}

// Re-export for convenience
export type { AlarmStatus };
