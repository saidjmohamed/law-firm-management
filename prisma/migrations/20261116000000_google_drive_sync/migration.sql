CREATE TABLE "DriveConnection" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "encryptedRefreshToken" TEXT NOT NULL,
  "email" TEXT,
  "rootFolderId" TEXT,
  "rootFolderName" TEXT,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DriveConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DriveEntityLink" (
  "id" SERIAL NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" INTEGER NOT NULL,
  "folderId" TEXT NOT NULL,
  "folderName" TEXT,
  "markdownId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DriveEntityLink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DriveEntityLink_entityType_entityId_key" ON "DriveEntityLink"("entityType", "entityId");
CREATE INDEX "DriveEntityLink_folderId_idx" ON "DriveEntityLink"("folderId");

CREATE TABLE "DriveSyncJob" (
  "id" SERIAL NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" INTEGER NOT NULL,
  "eventType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dedupeKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DriveSyncJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DriveSyncJob_dedupeKey_key" ON "DriveSyncJob"("dedupeKey");
CREATE INDEX "DriveSyncJob_status_runAfter_idx" ON "DriveSyncJob"("status", "runAfter");
CREATE INDEX "DriveSyncJob_entityType_entityId_idx" ON "DriveSyncJob"("entityType", "entityId");
