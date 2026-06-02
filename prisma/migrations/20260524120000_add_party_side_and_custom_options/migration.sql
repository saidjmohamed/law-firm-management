-- AlterTable: Add side column to Party
ALTER TABLE "Party" ADD COLUMN IF NOT EXISTS "side" TEXT NOT NULL DEFAULT 'for';

-- CreateTable: CustomOption
CREATE TABLE IF NOT EXISTS "CustomOption" (
    "id" SERIAL NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CustomOption_field_value_key" ON "CustomOption"("field", "value");
