"use client";

import { useQuery } from "@tanstack/react-query";
import { NoraMap } from "@/components/map/nora-map";
import { API_ROUTES, authFetch } from "@/lib/api";

const BOGOTA_CENTER: [number, number] = [-74.0721, 4.711];
const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

async function fetchGeoJSON(url: string): Promise<GeoJSON.FeatureCollection> {
  const res = await authFetch(url);
  if (!res.ok) return EMPTY_FEATURE_COLLECTION;
  return res.json();
}

export default function MapPage() {
  const incidentsQuery = useQuery({
    queryKey: ["map", "incidents"],
    queryFn: () => fetchGeoJSON(API_ROUTES.mapIncidents),
    refetchInterval: 15_000,
  });
  const resourcesQuery = useQuery({
    queryKey: ["map", "resources"],
    queryFn: () => fetchGeoJSON(API_ROUTES.mapResources),
  });
  const missingPersonsQuery = useQuery({
    queryKey: ["map", "missing-persons"],
    queryFn: () => fetchGeoJSON(API_ROUTES.mapMissingPersons),
    refetchInterval: 30_000,
  });

  return (
    <main className="flex min-h-screen flex-col">
      <div className="glass flex items-center justify-between px-4 py-3 text-sm">
        <span className="font-medium">Mapa NORA</span>
        <span className="text-muted-foreground">
          {incidentsQuery.data?.features.length ?? 0} incidentes activos
        </span>
      </div>
      <NoraMap
        center={BOGOTA_CENTER}
        incidents={incidentsQuery.data ?? EMPTY_FEATURE_COLLECTION}
        resources={resourcesQuery.data ?? EMPTY_FEATURE_COLLECTION}
        missingPersons={missingPersonsQuery.data ?? EMPTY_FEATURE_COLLECTION}
        className="h-[calc(100vh-3.5rem-3rem)] w-full"
      />
    </main>
  );
}

