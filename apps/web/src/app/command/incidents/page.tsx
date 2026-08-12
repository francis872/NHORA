"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Role, type IncidentDto } from "@nora/types";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { API_ROUTES, authFetch } from "@/lib/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { INCIDENT_TYPE_LABELS } from "@/lib/incident-labels";

const STATUS_OPTIONS = [
  "ALL",
  "REPORTED",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "DUPLICATE",
] as const;

const PRIORITY_BADGE: Record<string, string> = {
  LOW: "bg-emerald-500/20 text-emerald-400",
  MEDIUM: "bg-yellow-500/20 text-yellow-400",
  HIGH: "bg-orange-500/20 text-orange-400",
  CRITICAL: "bg-red-500/20 text-red-400",
};

export default function CommandIncidentsPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("ALL");
  const queryClient = useQueryClient();

  const isOperator = user?.role === Role.OPERATOR || user?.role === Role.ADMIN;

  const incidentsQuery = useQuery({
    queryKey: ["command", "incidents", status],
    queryFn: async (): Promise<IncidentDto[]> => {
      const url = new URL(API_ROUTES.incidents);
      if (status !== "ALL") url.searchParams.set("status", status);
      const res = await authFetch(url.toString());
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOperator,
    refetchInterval: 10_000,
  });

  const verify = async (id: string) => {
    await authFetch(API_ROUTES.incident(id), {
      method: "PATCH",
      body: JSON.stringify({ status: "VERIFIED" }),
    });
    queryClient.invalidateQueries({ queryKey: ["command", "incidents"] });
  };

  if (userLoading) return null;

  if (!isOperator) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 text-center">
        <GlassPanel>
          <p className="text-sm text-muted-foreground">
            Esta vista es solo para operadores y administradores autenticados.
          </p>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Incidentes — Command Center</h1>
        <div className="flex items-center gap-2">
          <Link href="/command/missing-persons">
            <Button variant="outline" size="sm">Personas buscadas</Button>
          </Link>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
            className="w-auto"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <GlassPanel className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Reportado por</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(incidentsQuery.data ?? []).map((incident) => (
              <tr key={incident.id} className="border-t border-border">
                <td className="px-4 py-3">{INCIDENT_TYPE_LABELS[incident.type]}</td>
                <td className="max-w-xs truncate px-4 py-3">{incident.description}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {incident.reporterName ?? (incident.reporterDeviceId ? "Anónimo" : "—")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      PRIORITY_BADGE[incident.priorityClass] ?? ""
                    }`}
                  >
                    {incident.priorityClass}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{incident.status}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/incidents/${incident.id}`}>
                      <Button variant="outline" size="sm">
                        Responder
                      </Button>
                    </Link>
                    {(incident.status === "REPORTED" || incident.status === "PENDING_VERIFICATION") && (
                      <Button variant="outline" size="sm" onClick={() => verify(incident.id)}>
                        Verificar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {incidentsQuery.data?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No hay incidentes para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassPanel>
    </main>
  );
}
