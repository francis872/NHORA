import { IsEnum } from "class-validator";
import { MissingPersonStatus } from "@nora/types";

export class UpdateMissingPersonStatusDto {
  @IsEnum(MissingPersonStatus)
  status!: MissingPersonStatus;
}
