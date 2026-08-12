import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSafetyCheckinDto } from "./dto/create-safety-checkin.dto";

@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSafetyCheckinDto, userId?: string) {
    return this.prisma.safetyCheckin.create({
      data: {
        userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        note: dto.note,
      },
    });
  }
}
