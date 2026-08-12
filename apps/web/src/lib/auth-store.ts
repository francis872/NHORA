// Minimal client-side token storage for Phase 1.
// KNOWN LIMITATION (tracked for Phase 6 — security hardening): tokens are kept in
// localStorage for simplicity. This is vulnerable to XSS token theft; the target
// design is an httpOnly refresh-token cookie issued by the API, with the access
// token held only in memory.
import type { AuthTokens } from "@nora/types";

const STORAGE_KEY = "nora.auth.tokens";

export function saveTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function getTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AuthTokens) : null;
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
