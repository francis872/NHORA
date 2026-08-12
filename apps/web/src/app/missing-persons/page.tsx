"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalStorageState } from "@/lib/use-local-storage";
import { z } from "zod";
import { Search, LoaderCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlassPanel } from "@/components/ui/glass-panel";
import { NoraMap } from "@/components/map/nora-map";
import { API_ROUTES, authFetch } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import { getIdentity } from "@/lib/identity";

const BOGOTA_CENTER: [number, number] = [-74.0721, 4.711];
const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

const STATUS_LABELS: Record<string, string> = {
  SEARCHING: "Buscando",
  LOCATED_CONFIRMED: "Localizada y confirmada",
  NOT_FOUND: "No encontrada",
};

const STATUS_BADGE: Record<string, string> = {
  SEARCHING: "bg-yellow-500/20 text-yellow-400",
  LOCATED_CONFIRMED: "bg-emerald-500/20 text-emerald-400",
  NOT_FOUND: "bg-red-500/20 text-red-400",
};

interface MissingPersonResult {
  id: string;
  name: string;
  municipality: string;
  ageApprox: number | null;
  status: string;
  updatedAt: string;
}

const reportSchema = z.object({
  name: z.string().min(2, "Ingresa el nombre"),
  municipality: z.string().min(2, "Ingresa el municipio"),
  department: z.string().optional(),
  ageApprox: z.coerce.number().int().min(0).max(120).optional(),
  description: z.string().optional(),
});

type ReportValues = z.infer<typeof reportSchema>;

export default function MissingPersonsPage() {
  const [searchDraft, setSearchDraft, clearSearchDraft] = useLocalStorageState(
    "nora.missing-persons.searchDraft",
    { name: "", municipality: "" },
  );
  const [name, setName] = useState(searchDraft.name);
  const [municipality, setMunicipality] = useState(searchDraft.municipality);
  const [results, setResults] = useState<MissingPersonResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mode, setMode] = useState<"search" | "report" | "done">("search");
  const [coords, setCoords, clearCoords] = useLocalStorageState<{ latitude: number; longitude: number } | null>(
    "nora.missing-persons.coords",
    null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker, clearShowMapPicker] = useLocalStorageState<boolean>(
    "nora.missing-persons.showMapPicker",
    false,
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [reportDraft, setReportDraft, clearReportDraft] = useLocalStorageState<{
    name: string;
    municipality: string;
    department: string;
    ageApprox: string;
    description: string;
  }>("nora.missing-persons.reportDraft", {
    name: "",
    municipality: "",
    department: "",
    ageApprox: "",
    description: "",
  });
  const searchAbortRef = useRef<AbortController | null>(null);

  const parsedReportDraft: Partial<ReportValues> = {
    name: reportDraft.name || undefined,
    municipality: reportDraft.municipality || undefined,
    department: reportDraft.department || undefined,
    ageApprox:
      reportDraft.ageApprox !== "" && !Number.isNaN(Number(reportDraft.ageApprox))
        ? Number(reportDraft.ageApprox)
        : undefined,
    description: reportDraft.description || undefined,
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: parsedReportDraft,
  });

  const reportFormValues = watch();

  useEffect(() => {
    setSearchDraft({ name, municipality });
  }, [name, municipality, setSearchDraft]);

  useEffect(() => {
    setReportDraft((current) => ({
      ...current,
      name: reportFormValues.name ?? "",
      municipality: reportFormValues.municipality ?? "",
      department: reportFormValues.department ?? "",
      ageApprox:
        reportFormValues.ageApprox !== undefined && reportFormValues.ageApprox !== null
          ? String(reportFormValues.ageApprox)
          : "",
      description: reportFormValues.description ?? "",
    }));
  }, [reportFormValues, setReportDraft]);

  const clearSearchDraftAndReset = () => {
    clearSearchDraft();
    setName("");
    setMunicipality("");
  };

  const clearReportDraftAndReset = () => {
    clearReportDraft();
    clearCoords();
    clearShowMapPicker();
    reset({
      name: "",
      municipality: "",
      department: "",
      ageApprox: undefined,
      description: "",
    });
  };

  const hasSearchDraft = searchDraft.name !== "" || searchDraft.municipality !== "";
  const hasReportDraft =
    reportDraft.name !== "" ||
    reportDraft.municipality !== "" ||
    reportDraft.department !== "" ||
    reportDraft.ageApprox !== "" ||
    reportDraft.description !== "";

  const handleSearch = async () => {
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearchError(null);
    setSearching(true);
    try {
      const url = new URL(API_ROUTES.missingPersons);
      if (name.trim()) url.searchParams.set("name", name.trim());
      if (municipality.trim()) url.searchParams.set("municipality", municipality.trim());
      const res = await authFetch(url.toString(), { signal: controller.signal });
      setResults(res.ok ? await res.json() : []);
    } catch (error) {
      setSearchError(controller.signal.aborted ? "Búsqueda cancelada." : error instanceof Error ? error.message : "No se pudo buscar ahora.");
    } finally {
      if (searchAbortRef.current === controller) {
        searchAbortRef.current = null;
        setSearching(false);
      }
    }
  };

  const cancelSearch = () => searchAbortRef.current?.abort();

  const handleLocate = async () => {
    setLocationError(null);
    try {
      setCoords(await getCurrentPosition());
      setShowMapPicker(false);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : "No se pudo obtener tu ubicación.");
      setShowMapPicker(true);
    }
  };

  const onSubmit = async (values: ReportValues) => {
    setServerError(null);
    const identity = getIdentity();
    try {
      const res = await authFetch(API_ROUTES.missingPersons, {
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
        setServerError(body?.message ?? "No se pudo crear el reporte.");
        return;
      }
      setMode("done");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "No se pudo crear el reporte.");
    }
  };

  if (mode === "done") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12 text-center">
        <GlassPanel className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold">Reporte creado</h1>
          <p className="text-sm text-muted-foreground">
            El reporte quedó registrado como <span className="font-medium text-foreground">Buscando</span>.
            Su estado cambiará cuando la persona sea localizada y confirmada, o si se descarta.
          </p>
          <Link href="/">
            <Button className="w-full">Volver al inicio</Button>
          </Link>
        </GlassPanel>
      </main>
    );
  }

  if (mode === "report") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Crear reporte</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra a la persona para que otros puedan encontrar coincidencias.
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
            <Input placeholder="Nombre" {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-critical">{errors.name.message}</p>}
          </div>
          <div>
            <Input placeholder="Municipio" {...register("municipality")} />
            {errors.municipality && (
              <p className="mt-1 text-xs text-critical">{errors.municipality.message}</p>
            )}
          </div>
          <Input placeholder="Departamento (opcional)" {...register("department")} />
          <Input type="number" min={0} max={120} placeholder="Edad aproximada (opcional)" {...register("ageApprox")} />
          <Textarea placeholder="Descripción, señas particulares (opcional)" {...register("description")} />

          <Button type="button" variant="outline" onClick={handleLocate}>
            <MapPin className="h-4 w-4" aria-hidden />
            {coords ? "Ubicación compartida" : "Compartir última ubicación conocida (opcional)"}
          </Button>
          {locationError && (
            <p className="text-xs text-critical">
              {locationError} Toca el mapa para marcarla manualmente.
            </p>
          )}
          {showMapPicker && (
            <div className="overflow-hidden rounded-xl border border-border">
              <NoraMap
                center={coords ? [coords.longitude, coords.latitude] : BOGOTA_CENTER}
                incidents={EMPTY_FEATURE_COLLECTION}
                resources={EMPTY_FEATURE_COLLECTION}
                className="h-48 w-full"
                pickedPoint={coords}
                onPick={(point) => setCoords(point)}
              />
            </div>
          )}

          {serverError && <p className="text-sm text-critical">{serverError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Enviando..." : "Crear reporte"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setMode("search")}>
            Volver a la búsqueda
          </Button>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-12">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Personas sin contacto
        </p>
        <h1 className="mt-1 text-3xl font-bold">Buscar una persona</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Busca sin tildes ni mayúsculas. Revisa las coincidencias antes de crear un nuevo reporte.
        </p>
      </div>

      <GlassPanel className="flex flex-col gap-3">
        {hasSearchDraft && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Datos guardados localmente.</p>
              <Button type="button" variant="outline" size="sm" onClick={clearSearchDraftAndReset}>
                Borrar caché de búsqueda
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tu última búsqueda se mantiene en este dispositivo hasta que la borres.
            </p>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Municipio</label>
          <Input value={municipality} onChange={(e) => setMunicipality(e.target.value)} />
        </div>
        <Button onClick={searching ? cancelSearch : handleSearch} variant={searching ? "outline" : "default"}>
          {searching ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Search className="h-4 w-4" aria-hidden />
          )}
          {searching ? "Cancelar búsqueda" : "Buscar coincidencias"}
        </Button>
        {searchError && <p className="text-center text-sm text-critical">{searchError}</p>}
      </GlassPanel>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Resultados</h2>
        <Button variant="outline" size="sm" onClick={() => setMode("report")}>
          Crear reporte
        </Button>
      </div>

      {results === null && (
        <p className="text-center text-sm text-muted-foreground">Busca un nombre o municipio arriba.</p>
      )}
      {results?.length === 0 && (
        <GlassPanel className="text-center text-sm text-muted-foreground">
          No hay coincidencias. Puedes crear un nuevo reporte.
        </GlassPanel>
      )}

      <div className="flex flex-col gap-3">
        {results?.map((person) => (
          <GlassPanel key={person.id} className="flex flex-col gap-1">
            <span
              className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${
                STATUS_BADGE[person.status] ?? ""
              }`}
            >
              {STATUS_LABELS[person.status] ?? person.status}
            </span>
            <p className="text-lg font-semibold">{person.name}</p>
            <p className="text-sm text-muted-foreground">
              {person.municipality}
              {person.ageApprox ? ` · ${person.ageApprox} años aprox.` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Actualizado {new Date(person.updatedAt).toLocaleString()}
            </p>
          </GlassPanel>
        ))}
      </div>

      <Link href="/">
        <Button variant="outline" className="w-full">
          Volver al inicio
        </Button>
      </Link>
    </main>
  );
}
