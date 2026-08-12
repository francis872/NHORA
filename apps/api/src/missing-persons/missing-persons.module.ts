import { Module } from "@nestjs/common";
import { MissingPersonsController } from "./missing-persons.controller";
import { MissingPersonsService } from "./missing-persons.service";

@Module({
  controllers: [MissingPersonsController],
  providers: [MissingPersonsService],
  exports: [MissingPersonsService],
})
export class MissingPersonsModule {}
