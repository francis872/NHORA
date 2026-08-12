import { Type } from "class-transformer";
import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Min } from "class-validator";

export class CreateSosDto {
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  peopleAffected?: number;
}
