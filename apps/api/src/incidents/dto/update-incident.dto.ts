import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { IncidentStatus, Severity } from "@nora/types";

// Operator/admin-only updates (verification, status changes) — section 6/23 RBAC.
export class UpdateIncidentDto {
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;
}
