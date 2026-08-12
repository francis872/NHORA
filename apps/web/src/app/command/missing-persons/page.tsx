"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MissingPersonStatus, Role, type MissingPersonDto } from "@nora/types";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { API_ROUTES, authFetch } from "@/lib/api";
import { useCurrentUser } from "@/lib/use-current-user";

const STATUS_LABELS: Record<MissingPersonStatus, string> = {
  [MissingPersonStatus.SEARCHING]: "Buscando",
  [MissingPersonStatus.LOCATED_CONFIRMED]: "Localizada y confirmada",
  [MissingPersonStatus.NOT_FOUND]: "No encontrada",
};

const STATUS_BADGE: Record<MissingPersonStatus, string> = {
  [MissingPersonStatus.SEARCHING]: "bg-yellow-500/20 text-yellow-400",
  [MissingPersonStatus.LOCATED_CONFIRMED]: "bg-emerald-500/20 text-emerald-400",
  [MissingPersonStatus.NOT_FOUND]: "bg-red-500/20 text-red-400",
};

export default function CommandMissingPersonsPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const isOperator = user?.role === Role.OPERATOR || user?.role === Role.ADMIN;

  const peopleQuery = useQuery({
    queryKey: ["command", "missing-persons"],
    queryFn: async (): Promise<MissingPersonDto[]> => {
      const res = await authFetch(API_ROUTES.missingPersons);
      return res.ok ? res.json() : [];
    },
    enabled: isOperator,
    refetchInterval: 15_000,
  });

  const updateStatus = async (id: string, status: MissingPersonStatus) => {
    const res = await authFetch(`${API_ROUTES.missingPerson(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["command", "missing-persons"] });
      queryClient.invalidateQueries({ queryKey: ["map", "missing-persons"] });
    }
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
        <div>
          <h1 className="text-xl font-semibold">Personas buscadas</h1>
          <p className="text-sm text-muted-foreground">Actualiza el estado cuando exista confirmación operativa.</p>
        </div>
        <Link href="/command/incidents">
          <Button variant="outline" size="sm">Incidentes</Button>
        </Link>
      </div>

      <GlassPanel className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Persona</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3">Reportado por</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Actualizar</th>
            </tr>
          </thead>
          <tbody>
            {(peopleQuery.data ?? []).map((person) => (
              <tr key={person.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-medium">{person.name}</p>
                  {person.ageApprox !== null && <p className="text-xs text-muted-foreground">Edad aproximada: {person.ageApprox}</p>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {person.municipality}{person.department ? `, ${person.department}` : ""}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {person.reporterName ?? (person.reporterDeviceId ? "Anónimo" : "No disponible")}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGE[person.status]}`}>
                    {STATUS_LABELS[person.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Select
                    aria-label={`Estado de ${person.name}`}
                    value={person.status}
                    onChange={(event) => updateStatus(person.id, event.target.value as MissingPersonStatus)}
                    className="min-w-44"
                  >
                    {Object.values(MissingPersonStatus).map((status) => (
                      <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                    ))}
                  </Select>
                </td>
              </tr>
            ))}
            {peopleQuery.data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No hay reportes de personas buscadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassPanel>
    </main>
  );
}
