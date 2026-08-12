import { Type } from "class-transformer";
import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateMissingPersonDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  municipality!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  ageApprox?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  reporterName?: string;
}
