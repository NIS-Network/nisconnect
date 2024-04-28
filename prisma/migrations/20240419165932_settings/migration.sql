/*
  Warnings:

  - You are about to drop the column `latestAttempt` on the `TemporaryUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "deleteAccountCoolDown" INTEGER NOT NULL DEFAULT 86400000,
ADD COLUMN     "maxDeleteAccountAttempts" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "TemporaryUser" DROP COLUMN "latestAttempt",
ADD COLUMN     "latestSignUpAttempt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deleteAccountAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "latestDeleteAccountAttempt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
