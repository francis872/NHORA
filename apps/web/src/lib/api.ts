import { getTokens } from "./auth-store";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const API_ROUTES = {
  register: `${API_BASE_URL}/api/v1/auth/register`,
  login: `${API_BASE_URL}/api/v1/auth/login`,
  refresh: `${API_BASE_URL}/api/v1/auth/refresh`,
  me: `${API_BASE_URL}/api/v1/users/me`,
  incidents: `${API_BASE_URL}/api/v1/incidents`,
  incident: (id: string) => `${API_BASE_URL}/api/v1/incidents/${id}`,
  incidentMessages: (id: string) => `${API_BASE_URL}/api/v1/incidents/${id}/messages`,
  sos: `${API_BASE_URL}/api/v1/sos`,
  safetyCheckins: `${API_BASE_URL}/api/v1/safety-checkins`,
  mapIncidents: `${API_BASE_URL}/api/v1/map/incidents`,
  mapResources: `${API_BASE_URL}/api/v1/map/resources`,
  mapHospitals: `${API_BASE_URL}/api/v1/map/hospitals`,
} as const;

// Attaches the stored access token; callers handle 401s (token expiry) themselves —
// silent refresh-token rotation lands alongside the security hardening in Phase 6.
export async function authFetch(input: string, init: RequestInit = {}) {
  const tokens = getTokens();
  const headers = new Headers(init.headers);
  if (tokens?.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers });
}
