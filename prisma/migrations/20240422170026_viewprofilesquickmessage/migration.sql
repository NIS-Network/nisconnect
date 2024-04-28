-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "maxQuickMessageTextLength" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "maxQuickMessageVideoDuration" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "minQuickMessageTextLength" INTEGER NOT NULL DEFAULT 3;
