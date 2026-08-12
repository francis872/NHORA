import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Role } from "@nora/types";
import { MissingPersonsService } from "./missing-persons.service";
import { CreateMissingPersonDto } from "./dto/create-missing-person.dto";
import { SearchMissingPersonsDto } from "./dto/search-missing-persons.dto";
import { UpdateMissingPersonStatusDto } from "./dto/update-missing-person-status.dto";
import { Public } from "../auth/decorators/public.decorator";
import { OptionalAuth } from "../auth/decorators/optional-auth.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@nora/types";

// "Buscar una persona" — search/report/track missing persons. Searching and viewing a
// report never require an account; only status changes (found/confirmed) are operator-only.
@Controller("missing-persons")
export class MissingPersonsController {
  constructor(private readonly missingPersonsService: MissingPersonsService) {}

  @Public()
  @Get()
  search(@Query() query: SearchMissingPersonsDto) {
    return this.missingPersonsService.search(query);
  }

  @OptionalAuth()
  @Post()
  create(@Body() dto: CreateMissingPersonDto, @CurrentUser() user: JwtPayload | undefined) {
    return this.missingPersonsService.create(dto, user?.sub);
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.missingPersonsService.findOne(id);
  }

  @Roles(Role.OPERATOR, Role.ADMIN)
  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateMissingPersonStatusDto) {
    return this.missingPersonsService.updateStatus(id, dto.status);
  }
}
