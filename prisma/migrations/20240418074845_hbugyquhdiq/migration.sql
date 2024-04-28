/*
  Warnings:

  - A unique constraint covering the columns `[conversationId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_profileId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "conversationId" INTEGER;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "searchingGender" "SearchingGender" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_id_key" ON "Conversation"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_conversationId_key" ON "User"("conversationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
