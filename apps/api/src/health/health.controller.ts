import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Public } from "../auth/decorators/public.decorator";

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // Liveness — process is up.
  @Public()
  @Get("health")
  health() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  // Readiness — dependencies (database) are reachable.
  @Public()
  @Get("ready")
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ready", timestamp: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException("Database not reachable");
    }
  }
}
