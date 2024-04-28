-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('inappropriate', 'afk', 'sales', 'drugs', 'other');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "reports" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intruderId" BIGINT NOT NULL,
    "creatorId" BIGINT NOT NULL,
    "reason" "ReportReason" NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_id_key" ON "Report"("id");
