import { Controller, Get, Query } from "@nestjs/common";
import { MapService } from "./map.service";
import { NearbyQueryDto } from "./dto/nearby-query.dto";
import { ResourcesQueryDto } from "./dto/resources-query.dto";

@Controller("map")
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get("incidents")
  getIncidents(@Query() query: NearbyQueryDto) {
    return this.mapService.getIncidents(query);
  }

  @Get("resources")
  getResources(@Query() query: ResourcesQueryDto) {
    return this.mapService.getResources(query);
  }

  @Get("hospitals")
  getHospitals(@Query() query: NearbyQueryDto) {
    return this.mapService.getHospitals(query);
  }
}
