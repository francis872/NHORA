import { IncidentType, Severity } from "@nora/types";

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  [IncidentType.EARTHQUAKE]: "Sismo",
  [IncidentType.FLOOD]: "Inundación",
  [IncidentType.LANDSLIDE]: "Deslizamiento",
  [IncidentType.FIRE]: "Incendio",
  [IncidentType.STRUCTURAL_DAMAGE]: "Daño estructural",
  [IncidentType.ROAD_BLOCK]: "Vía bloqueada",
  [IncidentType.MISSING_PERSON]: "Persona desaparecida",
  [IncidentType.TRAPPED_PERSON]: "Persona atrapada",
  [IncidentType.MEDICAL_ASSISTANCE]: "Asistencia médica",
  [IncidentType.SUPPLY_REQUEST]: "Solicitud de suministros",
  [IncidentType.OTHER]: "Otro",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  [Severity.LOW]: "Baja",
  [Severity.MEDIUM]: "Media",
  [Severity.HIGH]: "Alta",
  [Severity.CRITICAL]: "Crítica",
};
