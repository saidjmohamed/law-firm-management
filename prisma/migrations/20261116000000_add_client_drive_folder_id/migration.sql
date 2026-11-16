-- Add a nullable Google Drive folder identifier to each client.
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "googleDriveFolderId" VARCHAR(255);
