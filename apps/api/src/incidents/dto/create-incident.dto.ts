import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { IncidentType, Severity } from "@nora/types";

export class CreateIncidentDto {
  @IsEnum(IncidentType)
  type!: IncidentType;

  @IsString()
  @MinLength(5, { message: "Describe el incidente con al menos 5 caracteres" })
  description!: string;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsString()
  locationLabel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  peopleAffected?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  peopleMissing?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  peopleInjured?: number;

  @IsOptional()
  @IsString()
  infrastructureAffected?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  reporterName?: string;
}
