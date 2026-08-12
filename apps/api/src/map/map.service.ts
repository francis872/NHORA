import { Injectable } from "@nestjs/common";
import { IncidentStatus, ResourceType } from "@nora/types";
import { PrismaService } from "../prisma/prisma.service";
import { NearbyQueryDto } from "./dto/nearby-query.dto";
import { ResourcesQueryDto } from "./dto/resources-query.dto";

interface IncidentRow {
  id: string;
  type: string;
  severity: string;
  priorityClass: string;
  priorityScore: number;
  status: string;
  description: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

interface ResourceRow {
  id: string;
  type: string;
  name: string;
  address: string | null;
  capacity: number | null;
  status: string;
  latitude: number;
  longitude: number;
}

const DEFAULT_RADIUS_METERS = 5000;

function toFeatureCollection<T extends { latitude: number; longitude: number }>(
  rows: T[],
  toProperties: (row: T) => Record<string, unknown>,
) {
  return {
    type: "FeatureCollection" as const,
    features: rows.map((row) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [row.longitude, row.latitude] },
      properties: toProperties(row),
    })),
  };
}

@Injectable()
export class MapService {
  constructor(private readonly prisma: PrismaService) {}

  async getIncidents(query: NearbyQueryDto) {
    const inactiveStatuses = [IncidentStatus.REJECTED, IncidentStatus.DUPLICATE];

    let rows: IncidentRow[];
    if (query.lat !== undefined && query.lng !== undefined) {
      const radius = query.radius ?? DEFAULT_RADIUS_METERS;
      rows = await this.prisma.$queryRaw<IncidentRow[]>`
        SELECT id, type, severity, "priorityClass", "priorityScore", status, description, latitude, longitude, "createdAt"
        FROM incidents
        WHERE status NOT IN ('REJECTED', 'DUPLICATE')
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
            ${radius}
          )
        ORDER BY "priorityScore" DESC
      `;
    } else {
      rows = await this.prisma.incident.findMany({
        where: { status: { notIn: inactiveStatuses } },
        orderBy: { priorityScore: "desc" },
      });
    }

    return toFeatureCollection(rows, (incident) => ({
      id: incident.id,
      type: incident.type,
      severity: incident.severity,
      priorityClass: incident.priorityClass,
      priorityScore: incident.priorityScore,
      status: incident.status,
      description: incident.description,
      createdAt: incident.createdAt,
    }));
  }

  async getResources(query: ResourcesQueryDto) {
    let rows: ResourceRow[];
    if (query.lat !== undefined && query.lng !== undefined) {
      const radius = query.radius ?? DEFAULT_RADIUS_METERS;
      rows = query.type
        ? await this.prisma.$queryRaw<ResourceRow[]>`
            SELECT id, type, name, address, capacity, status, latitude, longitude FROM resources
            WHERE type = ${query.type}::"ResourceType"
              AND ST_DWithin(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
                ${radius}
              )
          `
        : await this.prisma.$queryRaw<ResourceRow[]>`
            SELECT id, type, name, address, capacity, status, latitude, longitude FROM resources
            WHERE ST_DWithin(
              ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
              ${radius}
            )
          `;
    } else {
      rows = await this.prisma.resource.findMany({
        where: query.type ? { type: query.type } : undefined,
      });
    }

    return toFeatureCollection(rows, (resource) => ({
      id: resource.id,
      type: resource.type,
      name: resource.name,
      address: resource.address,
      capacity: resource.capacity,
      status: resource.status,
    }));
  }

  getHospitals(query: NearbyQueryDto) {
    return this.getResources({ ...query, type: ResourceType.HOSPITAL });
  }

  async getMissingPersons() {
    const rows = await this.prisma.missingPerson.findMany({
      where: { status: "SEARCHING", latitude: { not: null }, longitude: { not: null } },
    });

    return toFeatureCollection(
      rows.map((person) => ({
        latitude: person.latitude as number,
        longitude: person.longitude as number,
        id: person.id,
        name: person.name,
        municipality: person.municipality,
        status: person.status,
      })),
      (person) => ({ id: person.id, name: person.name, municipality: person.municipality, status: person.status }),
    );
  }
}
