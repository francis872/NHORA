import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { IncidentsService } from "../incidents/incidents.service";
import { CreateSosDto } from "./dto/create-sos.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@nora/types";

@Controller("sos")
export class SosController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(@Body() dto: CreateSosDto, @CurrentUser() user: JwtPayload) {
    const { incident, merged } = await this.incidentsService.createSos({
      latitude: dto.latitude,
      longitude: dto.longitude,
      description: dto.description,
      peopleAffected: dto.peopleAffected,
      userId: user.sub,
    });

    return {
      incidentId: incident.id,
      status: incident.status,
      merged,
    };
  }
}
