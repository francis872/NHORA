import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { IncidentStatus, IncidentType, Role, Severity } from "@nora/types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { UpdateIncidentDto } from "./dto/update-incident.dto";
import { CreateIncidentReportDto } from "./dto/create-incident-report.dto";
import { QueryIncidentsDto } from "./dto/query-incidents.dto";
import { computePriority } from "./priority.util";

// Deterministic duplicate window (section 14). ML-based dedup can replace/augment
// this in a later phase without changing the public create() contract.
const DUPLICATE_RADIUS_METERS = 500;
const DUPLICATE_WINDOW_MINUTES = 30;

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findPossibleDuplicate(
    type: IncidentType,
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM incidents
      WHERE type = ${type}::"IncidentType"
        AND status NOT IN ('REJECTED', 'DUPLICATE')
        AND "createdAt" > NOW() - make_interval(mins => ${DUPLICATE_WINDOW_MINUTES}::int)
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${DUPLICATE_RADIUS_METERS}
        )
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    return rows[0]?.id ?? null;
  }

  async create(dto: CreateIncidentDto, userId?: string) {
    const severity = dto.severity ?? Severity.MEDIUM;
    const duplicateOfId = await this.findPossibleDuplicate(dto.type, dto.latitude, dto.longitude);

    if (duplicateOfId) {
      await this.prisma.incidentReport.create({
        data: {
          incidentId: duplicateOfId,
          reportedById: userId,
          description: dto.description,
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
      });

      const existing = await this.prisma.incident.findUniqueOrThrow({
        where: { id: duplicateOfId },
      });
      const corroboratingReports = await this.prisma.incidentReport.count({
        where: { incidentId: duplicateOfId },
      });
      const { score, priorityClass } = computePriority({
        severity: existing.severity as unknown as Severity,
        peopleAffected: existing.peopleAffected,
        peopleMissing: existing.peopleMissing,
        peopleInjured: existing.peopleInjured,
        infrastructureAffected: existing.infrastructureAffected,
        corroboratingReports,
      });

      const incident = await this.prisma.incident.update({
        where: { id: duplicateOfId },
        data: { priorityScore: score, priorityClass },
      });

      return { incident, merged: true as const };
    }

    const { score, priorityClass } = computePriority({
      severity,
      peopleAffected: dto.peopleAffected,
      peopleMissing: dto.peopleMissing,
      peopleInjured: dto.peopleInjured,
      infrastructureAffected: dto.infrastructureAffected,
    });

    const incident = await this.prisma.incident.create({
      data: {
        type: dto.type,
        description: dto.description,
        severity,
        priorityScore: score,
        priorityClass,
        latitude: dto.latitude,
        longitude: dto.longitude,
        locationLabel: dto.locationLabel,
        peopleAffected: dto.peopleAffected,
        peopleMissing: dto.peopleMissing,
        peopleInjured: dto.peopleInjured,
        infrastructureAffected: dto.infrastructureAffected,
        reportedById: userId,
      },
    });

    return { incident, merged: false as const };
  }

  async createSos(input: {
    latitude: number;
    longitude: number;
    description?: string;
    peopleAffected?: number;
    userId?: string;
  }) {
    return this.create(
      {
        type: IncidentType.OTHER,
        description: input.description ?? "Solicitud de ayuda vía botón SOS",
        severity: Severity.CRITICAL,
        latitude: input.latitude,
        longitude: input.longitude,
        peopleAffected: input.peopleAffected,
      },
      input.userId,
    );
  }

  async findAll(query: QueryIncidentsDto, requester: { sub: string; role: Role }) {
    const where = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(requester.role === Role.CITIZEN ? { reportedById: requester.sub } : {}),
    };

    return this.prisma.incident.findMany({
      where,
      orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
    });
  }

  async findOne(id: string, requester: { sub: string; role: Role }) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException("Incident not found");

    if (requester.role === Role.CITIZEN && incident.reportedById !== requester.sub) {
      throw new ForbiddenException("You can only view your own reports");
    }

    return incident;
  }

  async update(id: string, dto: UpdateIncidentDto, operatorId: string) {
    const existing = await this.prisma.incident.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Incident not found");

    const severity = (dto.severity ?? existing.severity) as unknown as Severity;
    const isNewlyVerified = dto.status === IncidentStatus.VERIFIED && existing.status !== IncidentStatus.VERIFIED;
    const corroboratingReports = await this.prisma.incidentReport.count({
      where: { incidentId: id },
    });

    const { score, priorityClass } = computePriority({
      severity,
      peopleAffected: existing.peopleAffected,
      peopleMissing: existing.peopleMissing,
      peopleInjured: existing.peopleInjured,
      infrastructureAffected: existing.infrastructureAffected,
      corroboratingReports,
    });

    return this.prisma.incident.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.severity ? { severity: dto.severity } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        priorityScore: score,
        priorityClass,
        ...(isNewlyVerified ? { verifiedAt: new Date(), verifiedById: operatorId } : {}),
      },
    });
  }

  async addReport(incidentId: string, dto: CreateIncidentReportDto, userId?: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new NotFoundException("Incident not found");

    const report = await this.prisma.incidentReport.create({
      data: {
        incidentId,
        reportedById: userId,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    const corroboratingReports = await this.prisma.incidentReport.count({
      where: { incidentId },
    });
    const { score, priorityClass } = computePriority({
      severity: incident.severity as unknown as Severity,
      peopleAffected: incident.peopleAffected,
      peopleMissing: incident.peopleMissing,
      peopleInjured: incident.peopleInjured,
      infrastructureAffected: incident.infrastructureAffected,
      corroboratingReports,
    });
    await this.prisma.incident.update({
      where: { id: incidentId },
      data: { priorityScore: score, priorityClass },
    });

    return report;
  }
}
