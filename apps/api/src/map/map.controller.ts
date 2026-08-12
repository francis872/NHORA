import { Controller, Get, Query } from "@nestjs/common";
import { MapService } from "./map.service";
import { NearbyQueryDto } from "./dto/nearby-query.dto";
import { ResourcesQueryDto } from "./dto/resources-query.dto";
import { Public } from "../auth/decorators/public.decorator";

// Viewing the map (active incidents, hospitals, shelters) must not require an account —
// it's the primary situational-awareness tool during an emergency.
@Controller("map")
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Public()
  @Get("incidents")
  getIncidents(@Query() query: NearbyQueryDto) {
    return this.mapService.getIncidents(query);
  }

  @Public()
  @Get("resources")
  getResources(@Query() query: ResourcesQueryDto) {
    return this.mapService.getResources(query);
  }

  @Public()
  @Get("hospitals")
  getHospitals(@Query() query: NearbyQueryDto) {
    return this.mapService.getHospitals(query);
  }
}
