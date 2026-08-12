export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const API_ROUTES = {
  register: `${API_BASE_URL}/api/v1/auth/register`,
  login: `${API_BASE_URL}/api/v1/auth/login`,
  refresh: `${API_BASE_URL}/api/v1/auth/refresh`,
  me: `${API_BASE_URL}/api/v1/users/me`,
} as const;
