/*
  Warnings:

  - You are about to drop the column `genderPreference` on the `Profile` table. All the data in the column will be lost.
  - Added the required column `searchingGender` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SearchingGender" AS ENUM ('male', 'female', 'all');

-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "minAllowedAge" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "genderPreference",
ADD COLUMN     "searchingGender" "SearchingGender" NOT NULL;

-- DropEnum
DROP TYPE "GenderPreference";
