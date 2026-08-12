import { Type } from "class-transformer";
import { IsLatitude, IsLongitude, IsOptional, IsString, MinLength } from "class-validator";

export class CreateIncidentReportDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;
}
