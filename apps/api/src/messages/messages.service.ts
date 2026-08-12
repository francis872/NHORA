import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@nora/types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMessageDto } from "./dto/create-message.dto";

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  // Anyone holding the (unguessable) incident id can read/write its thread, unless
  // it's already tied to a specific account or device — then only that citizen, or
  // an operator/admin, may access it. This mirrors the anonymous-first design used
  // for SOS/incident reporting: no account required, but existing owners are protected.
  private async assertAccess(
    incidentId: string,
    requester: { userId?: string; role?: Role; deviceId?: string },
  ) {
    const incident = await this.prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new NotFoundException("Incident not found");

    if (requester.role === Role.OPERATOR || requester.role === Role.ADMIN) return incident;

    const ownsByAccount = incident.reportedById && incident.reportedById === requester.userId;
    const ownsByDevice = incident.reporterDeviceId && incident.reporterDeviceId === requester.deviceId;
    const isUnclaimed = !incident.reportedById && !incident.reporterDeviceId;

    if (ownsByAccount || ownsByDevice || isUnclaimed) return incident;

    throw new ForbiddenException("You don't have access to this conversation");
  }

  async findAll(incidentId: string, requester: { userId?: string; role?: Role; deviceId?: string }) {
    await this.assertAccess(incidentId, requester);
    return this.prisma.message.findMany({
      where: { incidentId },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(
    incidentId: string,
    dto: CreateMessageDto,
    requester: { userId?: string; role?: Role; deviceId?: string },
  ) {
    await this.assertAccess(incidentId, requester);
    const isOperator = requester.role === Role.OPERATOR || requester.role === Role.ADMIN;

    return this.prisma.message.create({
      data: {
        incidentId,
        senderRole: isOperator ? "OPERATOR" : "CITIZEN",
        senderUserId: requester.userId,
        senderName: dto.senderName ?? (isOperator ? "Operador" : "Ciudadano"),
        body: dto.body,
      },
    });
  }
}
