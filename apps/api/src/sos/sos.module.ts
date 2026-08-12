import { Module } from "@nestjs/common";
import { SosController } from "./sos.controller";
import { IncidentsModule } from "../incidents/incidents.module";

@Module({
  imports: [IncidentsModule],
  controllers: [SosController],
})
export class SosModule {}
