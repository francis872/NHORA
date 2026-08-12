import { IsEnum, IsOptional } from "class-validator";
import { ResourceType } from "@nora/types";
import { NearbyQueryDto } from "./nearby-query.dto";

export class ResourcesQueryDto extends NearbyQueryDto {
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;
}
