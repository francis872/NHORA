import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { MessagesService } from "./messages.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { OptionalAuth } from "../auth/decorators/optional-auth.decorator";
import type { JwtPayload } from "@nora/types";

// Direct messaging between a citizen (with or without an account) and command-center
// operators, scoped to one incident/SOS report — see MessagesService for the access rule.
@Controller("incidents/:id/messages")
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @OptionalAuth()
  @Get()
  findAll(
    @Param("id") id: string,
    @Query("deviceId") deviceId: string | undefined,
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    return this.messagesService.findAll(id, { userId: user?.sub, role: user?.role, deviceId });
  }

  @OptionalAuth()
  @Post()
  create(
    @Param("id") id: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    return this.messagesService.create(id, dto, {
      userId: user?.sub,
      role: user?.role,
      deviceId: dto.deviceId,
    });
  }
}
