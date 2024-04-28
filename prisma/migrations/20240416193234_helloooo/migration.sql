-- CreateTable
CREATE TABLE "TemporaryUser" (
    "id" BIGINT NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedPolicy" BOOLEAN NOT NULL DEFAULT false,
    "signUpAttempts" INTEGER NOT NULL DEFAULT 0,
    "latestAttempt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "language" "Language" NOT NULL DEFAULT 'en',

    CONSTRAINT "TemporaryUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" INTEGER NOT NULL DEFAULT 0,
    "maxSignUpAttempts" INTEGER NOT NULL DEFAULT 3,
    "signUpCoolDown" INTEGER NOT NULL DEFAULT 86400000,
    "defaultConfig" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemporaryUser_id_key" ON "TemporaryUser"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Config_id_key" ON "Config"("id");
