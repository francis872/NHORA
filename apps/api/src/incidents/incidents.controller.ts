import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Role } from "@nora/types";
import { IncidentsService } from "./incidents.service";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { UpdateIncidentDto } from "./dto/update-incident.dto";
import { CreateIncidentReportDto } from "./dto/create-incident-report.dto";
import { QueryIncidentsDto } from "./dto/query-incidents.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import type { JwtPayload } from "@nora/types";

@Controller("incidents")
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  create(@Body() dto: CreateIncidentDto, @CurrentUser() user: JwtPayload) {
    return this.incidentsService.create(dto, user.sub);
  }

  @Get()
  findAll(@Query() query: QueryIncidentsDto, @CurrentUser() user: JwtPayload) {
    return this.incidentsService.findAll(query, { sub: user.sub, role: user.role });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.incidentsService.findOne(id, { sub: user.sub, role: user.role });
  }

  // Operator/admin only — verification, status and severity changes (section 6/23).
  @Roles(Role.OPERATOR, Role.ADMIN)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.incidentsService.update(id, dto, user.sub);
  }

  @Post(":id/reports")
  addReport(
    @Param("id") id: string,
    @Body() dto: CreateIncidentReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.incidentsService.addReport(id, dto, user.sub);
  }
}
