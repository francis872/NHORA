"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// CartoDB Dark Matter — free, no API key, OSM-derived data (section 9/20: dark mode,
// OpenStreetMap as cartographic source). Swap for a self-hosted style later if needed.
const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [{ id: "carto-dark", type: "raster", source: "carto-dark" }],
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "#22c55e",
  MEDIUM: "#eab308",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

export interface NoraMapProps {
  center: [number, number];
  incidents: GeoJSON.FeatureCollection;
  resources: GeoJSON.FeatureCollection;
  className?: string;
}

export function NoraMap({ center, incidents, resources, className }: NoraMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center,
      zoom: 12,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("incidents", { type: "geojson", data: incidents });
      map.addLayer({
        id: "incidents-circles",
        type: "circle",
        source: "incidents",
        paint: {
          "circle-radius": 8,
          "circle-color": [
            "match",
            ["get", "priorityClass"],
            "CRITICAL",
            SEVERITY_COLORS.CRITICAL,
            "HIGH",
            SEVERITY_COLORS.HIGH,
            "MEDIUM",
            SEVERITY_COLORS.MEDIUM,
            SEVERITY_COLORS.LOW,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0b1220",
        },
      });

      map.addSource("resources", { type: "geojson", data: resources });
      map.addLayer({
        id: "resources-circles",
        type: "circle",
        source: "resources",
        paint: {
          "circle-radius": 6,
          "circle-color": "#38bdf8",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0b1220",
        },
      });

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
      for (const layerId of ["incidents-circles", "resources-circles"]) {
        map.on("mouseenter", layerId, (e) => {
          map.getCanvas().style.cursor = "pointer";
          const feature = e.features?.[0];
          if (!feature) return;
          const label =
            feature.properties?.name ?? feature.properties?.description ?? feature.properties?.type;
          popup.setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number])
            .setText(String(label))
            .addTo(map);
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
          popup.remove();
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("incidents")) return;
    (map.getSource("incidents") as maplibregl.GeoJSONSource).setData(incidents);
  }, [incidents]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("resources")) return;
    (map.getSource("resources") as maplibregl.GeoJSONSource).setData(resources);
  }, [resources]);

  return <div ref={containerRef} className={className} />;
}
