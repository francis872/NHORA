import { IsLatitude, IsLongitude, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSafetyCheckinDto {
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;
}
