// Lightweight, account-free identity: a persistent device id + display name stored
// locally. Lets operators identify/contact a citizen who never registered, and lets
// the citizen find their own reports again from this device (see my-reports.ts).
export interface Identity {
  deviceId: string;
  displayName: string;
}

const KEY = "nora.identity";
const DEFAULT_NAME = "Ciudadano";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getIdentity(): Identity {
  if (typeof window === "undefined") return { deviceId: "", displayName: DEFAULT_NAME };

  const raw = window.localStorage.getItem(KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Identity;
    } catch {
      // fall through and recreate a valid identity below
    }
  }

  const identity: Identity = { deviceId: generateId(), displayName: DEFAULT_NAME };
  window.localStorage.setItem(KEY, JSON.stringify(identity));
  return identity;
}

export function setDisplayName(name: string) {
  if (typeof window === "undefined") return;
  const identity = getIdentity();
  identity.displayName = name.trim() || DEFAULT_NAME;
  window.localStorage.setItem(KEY, JSON.stringify(identity));
}
