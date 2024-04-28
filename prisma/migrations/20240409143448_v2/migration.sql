-- CreateEnum
CREATE TYPE "School" AS ENUM ('akt', 'akb', 'fmalm', 'hbalm', 'ast', 'atr', 'krg', 'kt', 'kst', 'kzl', 'pvl', 'ptr', 'sm', 'tk', 'trz', 'ura', 'ukk', 'fmsh', 'hbsh', 'trk');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'banned', 'admin', 'superadmin');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('kz', 'en', 'ru');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "GenderPreference" AS ENUM ('male', 'female', 'all');

-- CreateTable
CREATE TABLE "User" (
    "id" BIGINT NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "Role" NOT NULL DEFAULT 'user',
    "login" TEXT NOT NULL,
    "school" "School" NOT NULL,
    "language" "Language" NOT NULL,
    "profileId" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "age" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "genderPreference" "GenderPreference" NOT NULL,
    "photoId" TEXT NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "User_profileId_key" ON "User"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_id_key" ON "Profile"("id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
