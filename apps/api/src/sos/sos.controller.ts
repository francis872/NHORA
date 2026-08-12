import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { IncidentsService } from "../incidents/incidents.service";
import { CreateSosDto } from "./dto/create-sos.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { OptionalAuth } from "../auth/decorators/optional-auth.decorator";
import type { JwtPayload } from "@nora/types";

@Controller("sos")
export class SosController {
  constructor(private readonly incidentsService: IncidentsService) {}

  // Anonymous SOS must work — most people asking for urgent help won't have an account.
  @OptionalAuth()
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(@Body() dto: CreateSosDto, @CurrentUser() user: JwtPayload | undefined) {
    const { incident, merged } = await this.incidentsService.createSos({
      latitude: dto.latitude,
      longitude: dto.longitude,
      description: dto.description,
      peopleAffected: dto.peopleAffected,
      userId: user?.sub,
      deviceId: dto.deviceId,
      reporterName: dto.reporterName,
    });

    return {
      incidentId: incident.id,
      status: incident.status,
      merged,
    };
  }
}
