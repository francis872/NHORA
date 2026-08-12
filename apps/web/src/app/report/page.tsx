"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { z } from "zod";
import { MapPin, LoaderCircle } from "lucide-react";
import { IncidentType } from "@nora/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/glass-panel";
import { NoraMap } from "@/components/map/nora-map";
import { API_ROUTES, authFetch } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import { INCIDENT_TYPE_LABELS } from "@/lib/incident-labels";
import { getIdentity } from "@/lib/identity";
import { addMyReport } from "@/lib/my-reports";

const BOGOTA_CENTER: [number, number] = [-74.0721, 4.711];
const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

const schema = z.object({
  type: z.nativeEnum(IncidentType),
  description: z.string().min(5, "Describe el incidente con al menos 5 caracteres"),
  peopleAffected: z.coerce.number().int().min(0).optional(),
  infrastructureAffected: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ReportIncidentPage() {
  const router = useRouter();
  const [coords, setCoords, clearCoords] = useLocalStorageState<{
    latitude: number;
    longitude: number;
  } | null>("nora.report.coords", null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker, clearShowMapPicker] = useLocalStorageState<boolean>(
    "nora.report.showMapPicker",
    false,
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; merged: boolean; priorityClass: string } | null>(
    null,
  );

  const [reportDraft, setReportDraft, clearReportDraft] = useLocalStorageState<{
    type: IncidentType;
    description: string;
    peopleAffected: string;
    infrastructureAffected: string;
  }>("nora.report.draft", {
    type: IncidentType.OTHER,
    description: "",
    peopleAffected: "",
    infrastructureAffected: "",
  });

  const parsedReportDraft: Partial<FormValues> = {
    type: reportDraft.type,
    description: reportDraft.description || undefined,
    peopleAffected:
      reportDraft.peopleAffected !== "" && !Number.isNaN(Number(reportDraft.peopleAffected))
        ? Number(reportDraft.peopleAffected)
        : undefined,
    infrastructureAffected: reportDraft.infrastructureAffected || undefined,
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: parsedReportDraft,
  });

  const reportFormValues = watch();

  useEffect(() => {
    setReportDraft((current) => ({
      ...current,
      type: reportFormValues.type,
      description: reportFormValues.description ?? "",
      peopleAffected:
        reportFormValues.peopleAffected !== undefined && reportFormValues.peopleAffected !== null
          ? String(reportFormValues.peopleAffected)
          : "",
      infrastructureAffected: reportFormValues.infrastructureAffected ?? "",
    }));
  }, [reportFormValues, setReportDraft]);

  const clearReportDraftAndReset = () => {
    clearReportDraft();
    clearCoords();
    clearShowMapPicker();
    reset({
      type: IncidentType.OTHER,
      description: "",
      peopleAffected: undefined,
      infrastructureAffected: "",
    });
  };

  const hasReportDraft =
    reportDraft.type !== IncidentType.OTHER ||
    reportDraft.description !== "" ||
    reportDraft.peopleAffected !== "" ||
    reportDraft.infrastructureAffected !== "";

  const handleLocate = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      setCoords(await getCurrentPosition());
      setShowMapPicker(false);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : "No se pudo obtener tu ubicación.");
      setShowMapPicker(true);
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    if (!coords) {
      setLocationError("Comparte tu ubicación, o elígela en el mapa, antes de enviar el reporte.");
      setShowMapPicker(true);
      return;
    }

    const identity = getIdentity();
    const res = await authFetch(API_ROUTES.incidents, {
      method: "POST",
      body: JSON.stringify({
        ...values,
        ...coords,
        deviceId: identity.deviceId,
        reporterName: identity.displayName,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.message ?? "No se pudo enviar el reporte.");
      return;
    }

    const data = await res.json();
    addMyReport({
      id: data.incident.id,
      kind: "INCIDENT",
      label: INCIDENT_TYPE_LABELS[values.type] ?? "Incidente",
      createdAt: new Date().toISOString(),
    });
    clearReportDraft();
    clearCoords();
    clearShowMapPicker();
    setResult({ id: data.incident.id, merged: data.merged, priorityClass: data.incident.priorityClass });
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
          <p className="text-xs text-muted-foreground">
            Un operador del centro de mando revisará y verificará este reporte. Puedes seguir el estado
            y hablar directamente con el equipo de atención en la conversación del reporte.
          </p>
          <Link href={`/incidents/${result.id}`}>
            <Button className="w-full">Ver conversación y estado</Button>
          </Link>
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
        {hasReportDraft && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Datos guardados localmente.</p>
              <Button type="button" variant="outline" size="sm" onClick={clearReportDraftAndReset}>
                Borrar borrador
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              El formulario conserva los datos en este navegador hasta que envíes o borres el borrador.
            </p>
          </div>
        )}

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
        {locationError && (
          <p className="text-xs text-critical">
            {locationError} Si tu navegador bloqueó el permiso, toca un punto en el mapa de abajo para
            marcar tu ubicación manualmente.
          </p>
        )}

        {showMapPicker && (
          <div className="overflow-hidden rounded-xl border border-border">
            <NoraMap
              center={coords ? [coords.longitude, coords.latitude] : BOGOTA_CENTER}
              incidents={EMPTY_FEATURE_COLLECTION}
              resources={EMPTY_FEATURE_COLLECTION}
              className="h-56 w-full"
              pickedPoint={coords}
              onPick={(point) => {
                setCoords(point);
                setLocationError(null);
              }}
            />
            <p className="bg-background/60 px-3 py-2 text-center text-xs text-muted-foreground">
              Toca el mapa para marcar dónde ocurre el incidente
            </p>
          </div>
        )}

        {serverError && <p className="text-sm text-critical">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Enviando..." : "Enviar reporte"}
        </Button>
      </GlassPanel>
    </main>
  );
}
