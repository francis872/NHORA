import "reflect-metadata";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

// Shared by main.ts and e2e tests so both boot the app identically (global
// prefix, validation pipe, security headers, CORS).
export function configureApp(app: INestApplication) {
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:3000",
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
  return app;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const port = process.env.API_PORT ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`NORA API listening on port ${port}`);
}

// Guard against re-running bootstrap() when this module is only imported for
// configureApp() (e.g. from e2e tests).
if (require.main === module) {
  bootstrap();
}
