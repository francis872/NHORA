"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, LoaderCircle } from "lucide-react";
import { IncidentType } from "@nora/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/glass-panel";
import { API_ROUTES, authFetch } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import { INCIDENT_TYPE_LABELS } from "@/lib/incident-labels";

const schema = z.object({
  type: z.nativeEnum(IncidentType),
  description: z.string().min(5, "Describe el incidente con al menos 5 caracteres"),
  peopleAffected: z.coerce.number().int().min(0).optional(),
  infrastructureAffected: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ReportIncidentPage() {
  const router = useRouter();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<{ merged: boolean; priorityClass: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: IncidentType.OTHER },
  });

  const handleLocate = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      setCoords(await getCurrentPosition());
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : "No se pudo obtener tu ubicación.");
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    if (!coords) {
      setLocationError("Comparte tu ubicación antes de enviar el reporte.");
      return;
    }

    const res = await authFetch(API_ROUTES.incidents, {
      method: "POST",
      body: JSON.stringify({ ...values, ...coords }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.message ?? "No se pudo enviar el reporte.");
      return;
    }

    const data = await res.json();
    setResult({ merged: data.merged, priorityClass: data.incident.priorityClass });
  };

  if (result) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12 text-center">
        <GlassPanel className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold">
            {result.merged ? "Reporte sumado a un incidente existente" : "Incidente registrado"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Prioridad estimada: <span className="font-medium text-foreground">{result.priorityClass}</span>
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Volver al inicio
          </Button>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Reportar incidente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta información ayuda a priorizar la respuesta. No sustituye una llamada de emergencia.
        </p>
      </div>

      <GlassPanel as="form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <Select {...register("type")}>
            {Object.entries(INCIDENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Textarea placeholder="¿Qué está ocurriendo?" {...register("description")} />
          {errors.description && (
            <p className="mt-1 text-xs text-critical">{errors.description.message}</p>
          )}
        </div>

        <div>
          <Input
            type="number"
            min={0}
            placeholder="Personas afectadas (opcional)"
            {...register("peopleAffected")}
          />
        </div>

        <div>
          <Input placeholder="Infraestructura afectada (opcional)" {...register("infrastructureAffected")} />
        </div>

        <Button type="button" variant="outline" onClick={handleLocate} disabled={locating}>
          {locating ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MapPin className="h-4 w-4" aria-hidden />
          )}
          {coords ? "Ubicación compartida" : "Compartir mi ubicación"}
        </Button>
        {locationError && <p className="text-xs text-critical">{locationError}</p>}

        {serverError && <p className="text-sm text-critical">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Enviando..." : "Enviar reporte"}
        </Button>
      </GlassPanel>
    </main>
  );
}
