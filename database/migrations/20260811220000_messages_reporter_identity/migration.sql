-- AlterTable
ALTER TABLE "incidents" ADD COLUMN "reporterDeviceId" TEXT;
ALTER TABLE "incidents" ADD COLUMN "reporterName" TEXT;

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "senderUserId" TEXT,
    "senderName" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_incidentId_idx" ON "messages"("incidentId");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
