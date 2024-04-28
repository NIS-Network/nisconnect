-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('enabled', 'disabled');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "status" "ProfileStatus" NOT NULL DEFAULT 'enabled';
