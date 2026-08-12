import { Injectable, NotFoundException } from "@nestjs/common";
import { MissingPersonStatus } from "@nora/types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMissingPersonDto } from "./dto/create-missing-person.dto";
import { SearchMissingPersonsDto } from "./dto/search-missing-persons.dto";
import { normalizeSearchText } from "./normalize";

@Injectable()
export class MissingPersonsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchMissingPersonsDto) {
    return this.prisma.missingPerson.findMany({
      where: {
        ...(query.name ? { nameNormalized: { contains: normalizeSearchText(query.name) } } : {}),
        ...(query.municipality
          ? { municipalityNormalized: { contains: normalizeSearchText(query.municipality) } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async create(dto: CreateMissingPersonDto, userId?: string) {
    return this.prisma.missingPerson.create({
      data: {
        name: dto.name,
        nameNormalized: normalizeSearchText(dto.name),
        municipality: dto.municipality,
        municipalityNormalized: normalizeSearchText(dto.municipality),
        department: dto.department,
        ageApprox: dto.ageApprox,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        reporterDeviceId: dto.deviceId,
        reporterName: dto.reporterName,
      },
    });
  }

  async findOne(id: string) {
    const person = await this.prisma.missingPerson.findUnique({ where: { id } });
    if (!person) throw new NotFoundException("Missing person report not found");
    return person;
  }

  async findAllForMap() {
    return this.prisma.missingPerson.findMany({
      where: { status: MissingPersonStatus.SEARCHING, latitude: { not: null }, longitude: { not: null } },
    });
  }

  async updateStatus(id: string, status: MissingPersonStatus) {
    const existing = await this.prisma.missingPerson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Missing person report not found");
    return this.prisma.missingPerson.update({ where: { id }, data: { status } });
  }
}
