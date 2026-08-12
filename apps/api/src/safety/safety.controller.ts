import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { SafetyService } from "./safety.service";
import { CreateSafetyCheckinDto } from "./dto/create-safety-checkin.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { OptionalAuth } from "../auth/decorators/optional-auth.decorator";
import type { JwtPayload } from "@nora/types";

@Controller("safety-checkins")
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  // "Estoy a salvo" must work without an account.
  @OptionalAuth()
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() dto: CreateSafetyCheckinDto, @CurrentUser() user: JwtPayload | undefined) {
    return this.safetyService.create(dto, user?.sub);
  }
}
