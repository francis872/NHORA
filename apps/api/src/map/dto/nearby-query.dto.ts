import { Type } from "class-transformer";
import { IsLatitude, IsLongitude, IsNumber, IsOptional, Min } from "class-validator";

export class NearbyQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  radius?: number;
}
