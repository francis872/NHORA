-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('EARTHQUAKE', 'FLOOD', 'LANDSLIDE', 'FIRE', 'STRUCTURAL_DAMAGE', 'ROAD_BLOCK', 'MISSING_PERSON', 'TRAPPED_PERSON', 'MEDICAL_ASSISTANCE', 'SUPPLY_REQUEST', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('REPORTED', 'PENDING_VERIFICATION', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('HOSPITAL', 'SHELTER', 'FIRE_STATION', 'POLICE_STATION', 'SUPPLY_POINT', 'MEETING_POINT', 'OTHER');

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priorityClass" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "status" "IncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationLabel" TEXT,
    "source" TEXT NOT NULL DEFAULT 'CITIZEN_APP',
    "confidenceScore" DOUBLE PRECISION,
    "peopleAffected" INTEGER,
    "peopleMissing" INTEGER,
    "peopleInjured" INTEGER,
    "infrastructureAffected" TEXT,
    "reportedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "duplicateOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_reports" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "reportedById" TEXT,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "capacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incidents_type_idx" ON "incidents"("type");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_latitude_longitude_idx" ON "incidents"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "incident_reports_incidentId_idx" ON "incident_reports"("incidentId");

-- CreateIndex
CREATE INDEX "resources_type_idx" ON "resources"("type");

-- CreateIndex
CREATE INDEX "resources_latitude_longitude_idx" ON "resources"("latitude", "longitude");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PostGIS: enable extension + functional GiST indexes for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE INDEX "incidents_geom_gist_idx" ON "incidents"
  USING GIST (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326));

CREATE INDEX "resources_geom_gist_idx" ON "resources"
  USING GIST (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326));