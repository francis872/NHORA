// Tracks reports/SOS alerts sent from this device, so the citizen can find their own
// conversation thread again later (see app/my-reports/page.tsx).
export interface MyReport {
  id: string;
  kind: "SOS" | "INCIDENT";
  label: string;
  createdAt: string;
}

const KEY = "nora.myReports";

export function getMyReports(): MyReport[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MyReport[];
  } catch {
    return [];
  }
}

export function addMyReport(report: MyReport) {
  if (typeof window === "undefined") return;
  const list = [report, ...getMyReports().filter((r) => r.id !== report.id)].slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(list));
}
