import { IsEnum, IsOptional } from "class-validator";
import { IncidentStatus, IncidentType, Severity } from "@nora/types";

export class QueryIncidentsDto {
  @IsOptional()
  @IsEnum(IncidentType)
  type?: IncidentType;

  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;
}
