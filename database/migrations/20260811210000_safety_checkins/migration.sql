-- CreateTable
CREATE TABLE "safety_checkins" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "safety_checkins_userId_idx" ON "safety_checkins"("userId");

-- AddForeignKey
ALTER TABLE "safety_checkins" ADD CONSTRAINT "safety_checkins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
