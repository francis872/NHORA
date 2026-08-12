-- CreateEnum
CREATE TYPE "MissingPersonStatus" AS ENUM ('SEARCHING', 'LOCATED_CONFIRMED', 'NOT_FOUND');

-- CreateTable
CREATE TABLE "missing_persons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "municipalityNormalized" TEXT NOT NULL,
    "department" TEXT,
    "ageApprox" INTEGER,
    "description" TEXT,
    "status" "MissingPersonStatus" NOT NULL DEFAULT 'SEARCHING',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "reporterDeviceId" TEXT,
    "reporterName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missing_persons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "missing_persons_nameNormalized_idx" ON "missing_persons"("nameNormalized");

-- CreateIndex
CREATE INDEX "missing_persons_municipalityNormalized_idx" ON "missing_persons"("municipalityNormalized");

-- CreateIndex
CREATE INDEX "missing_persons_status_idx" ON "missing_persons"("status");
