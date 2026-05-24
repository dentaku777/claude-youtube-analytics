-- CreateTable
CREATE TABLE "DailyQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyQuota_userId_date_idx" ON "DailyQuota"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuota_userId_date_key" ON "DailyQuota"("userId", "date");

-- AddForeignKey
ALTER TABLE "DailyQuota" ADD CONSTRAINT "DailyQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
