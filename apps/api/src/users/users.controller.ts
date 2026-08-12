import { Controller, Get, NotFoundException } from "@nestjs/common";
import { Role } from "@nora/types";
import { UsersService } from "./users.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import type { JwtPayload } from "@nora/types";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async me(@CurrentUser() user: JwtPayload) {
    const found = await this.usersService.findPublicById(user.sub);
    if (!found) throw new NotFoundException("User not found");
    return found;
  }

  // Admin-only listing — demonstrates RBAC (section 5 / 23). RolesGuard runs globally.
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAllPublic();
  }
}
