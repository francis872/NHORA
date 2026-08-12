import { IsOptional, IsString, MaxLength } from "class-validator";

export class SearchMissingPersonsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  municipality?: string;
}
