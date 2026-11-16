-- Add a nullable Google Drive folder identifier to each client.
ALTER TABLE "Client" ADD COLUMN "googleDriveFolderId" VARCHAR(255);
