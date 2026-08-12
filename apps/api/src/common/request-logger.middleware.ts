import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

// Structured request logging (see docs/architecture — Observability, section 34).
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = randomUUID();
    const start = Date.now();
    res.setHeader("x-request-id", requestId);

    res.on("finish", () => {
      const entry = {
        timestamp: new Date().toISOString(),
        service: "nora-api",
        request_id: requestId,
        user_id: (req as Request & { user?: { sub: string } }).user?.sub ?? null,
        event: `${req.method} ${req.originalUrl}`,
        status: res.statusCode,
        latency_ms: Date.now() - start,
      };
      this.logger.log(JSON.stringify(entry));
    });

    next();
  }
}
