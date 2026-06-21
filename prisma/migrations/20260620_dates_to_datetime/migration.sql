-- ============================================================================
-- Migration: تحويل حقول التواريخ من String إلى DateTime
-- التاريخ: 2026-06-20
-- آمنة: تحافظ على البيانات الحالية (تحويل النصوص ISO إلى timestamps)
-- يدعم: "2026-04-30" / "2026-04-30T00:00:00Z" / ISO timestamps
-- ============================================================================

-- 1) جدول القضايا
ALTER TABLE "Case" ADD COLUMN "registrationDate_new" TIMESTAMP(3);
ALTER TABLE "Case" ADD COLUMN "firstSessionDate_new" TIMESTAMP(3);
ALTER TABLE "Case" ADD COLUMN "delibDate_new" TIMESTAMP(3);
ALTER TABLE "Case" ADD COLUMN "judgmentDate_new" TIMESTAMP(3);

UPDATE "Case" SET "registrationDate_new" =
  CASE
    WHEN "registrationDate" ~ '^\d{4}-\d{2}-\d{2}(T.*)?$'
      THEN ("registrationDate" || CASE WHEN "registrationDate" ~ 'T' THEN '' ELSE 'T00:00:00Z' END)::TIMESTAMP(3)
    ELSE NULL
  END;

UPDATE "Case" SET "firstSessionDate_new" =
  CASE
    WHEN "firstSessionDate" ~ '^\d{4}-\d{2}-\d{2}(T.*)?$'
      THEN ("firstSessionDate" || CASE WHEN "firstSessionDate" ~ 'T' THEN '' ELSE 'T00:00:00Z' END)::TIMESTAMP(3)
    ELSE NULL
  END;

UPDATE "Case" SET "delibDate_new" =
  CASE
    WHEN "delibDate" ~ '^\d{4}-\d{2}-\d{2}(T.*)?$'
      THEN ("delibDate" || CASE WHEN "delibDate" ~ 'T' THEN '' ELSE 'T00:00:00Z' END)::TIMESTAMP(3)
    ELSE NULL
  END;

ALTER TABLE "Case" DROP COLUMN "registrationDate";
ALTER TABLE "Case" DROP COLUMN "firstSessionDate";
ALTER TABLE "Case" DROP COLUMN "delibDate";
ALTER TABLE "Case" RENAME COLUMN "registrationDate_new" TO "registrationDate";
ALTER TABLE "Case" RENAME COLUMN "firstSessionDate_new" TO "firstSessionDate";
ALTER TABLE "Case" RENAME COLUMN "delibDate_new" TO "delibDate";
ALTER TABLE "Case" RENAME COLUMN "judgmentDate_new" TO "judgmentDate";

-- 2) جدول التأجيلات - delayDate
ALTER TABLE "Delay" ADD COLUMN "delayDate_new" TIMESTAMP(3);

UPDATE "Delay" SET "delayDate_new" =
  CASE
    WHEN "delayDate" ~ '^\d{4}-\d{2}-\d{2}(T.*)?$'
      THEN ("delayDate" || CASE WHEN "delayDate" ~ 'T' THEN '' ELSE 'T00:00:00Z' END)::TIMESTAMP(3)
    ELSE NULL
  END;

ALTER TABLE "Delay" DROP COLUMN "delayDate";
ALTER TABLE "Delay" RENAME COLUMN "delayDate_new" TO "delayDate";

-- 3) جدول الجلسات - date
ALTER TABLE "Session" ADD COLUMN "date_new" TIMESTAMP(3);

UPDATE "Session" SET "date_new" =
  CASE
    WHEN "date" ~ '^\d{4}-\d{2}-\d{2}(T.*)?$'
      THEN ("date" || CASE WHEN "date" ~ 'T' THEN '' ELSE 'T00:00:00Z' END)::TIMESTAMP(3)
    ELSE NULL
  END;

ALTER TABLE "Session" DROP COLUMN "date";
ALTER TABLE "Session" RENAME COLUMN "date_new" TO "date";

-- 4) جدول المدفوعات - date
ALTER TABLE "Payment" ADD COLUMN "date_new" TIMESTAMP(3);

UPDATE "Payment" SET "date_new" =
  CASE
    WHEN "date" ~ '^\d{4}-\d{2}-\d{2}(T.*)?$'
      THEN ("date" || CASE WHEN "date" ~ 'T' THEN '' ELSE 'T00:00:00Z' END)::TIMESTAMP(3)
    ELSE NULL
  END;

ALTER TABLE "Payment" DROP COLUMN "date";
ALTER TABLE "Payment" RENAME COLUMN "date_new" TO "date";

-- 5) جدول الأرشيف - archiveDate
ALTER TABLE "Archive" ADD COLUMN "archiveDate_new" TIMESTAMP(3);

UPDATE "Archive" SET "archiveDate_new" =
  CASE
    WHEN "archiveDate" ~ '^\d{4}-\d{2}-\d{2}(T.*)?$'
      THEN ("archiveDate" || CASE WHEN "archiveDate" ~ 'T' THEN '' ELSE 'T00:00:00Z' END)::TIMESTAMP(3)
    ELSE NULL
  END;

ALTER TABLE "Archive" DROP COLUMN "archiveDate";
ALTER TABLE "Archive" RENAME COLUMN "archiveDate_new" TO "archiveDate";

-- 6) إضافة الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS "Client_name_idx" ON "Client"("name");
CREATE INDEX IF NOT EXISTS "Client_phone_idx" ON "Client"("phone");

CREATE INDEX IF NOT EXISTS "Case_caseNumber_idx" ON "Case"("caseNumber");
CREATE INDEX IF NOT EXISTS "Case_status_idx" ON "Case"("status");
CREATE INDEX IF NOT EXISTS "Case_delibDate_idx" ON "Case"("delibDate");
CREATE INDEX IF NOT EXISTS "Case_firstSessionDate_idx" ON "Case"("firstSessionDate");
CREATE INDEX IF NOT EXISTS "Case_clientId_idx" ON "Case"("clientId");

CREATE INDEX IF NOT EXISTS "Party_caseId_idx" ON "Party"("caseId");
CREATE INDEX IF NOT EXISTS "Party_name_idx" ON "Party"("name");
CREATE INDEX IF NOT EXISTS "Party_phone_idx" ON "Party"("phone");

CREATE INDEX IF NOT EXISTS "Delay_caseId_idx" ON "Delay"("caseId");
CREATE INDEX IF NOT EXISTS "Delay_delayDate_idx" ON "Delay"("delayDate");

CREATE INDEX IF NOT EXISTS "Session_caseId_idx" ON "Session"("caseId");
CREATE INDEX IF NOT EXISTS "Session_date_idx" ON "Session"("date");
CREATE INDEX IF NOT EXISTS "Session_status_idx" ON "Session"("status");

CREATE INDEX IF NOT EXISTS "Payment_caseId_idx" ON "Payment"("caseId");
CREATE INDEX IF NOT EXISTS "Payment_date_idx" ON "Payment"("date");
CREATE INDEX IF NOT EXISTS "Payment_type_idx" ON "Payment"("type");

CREATE INDEX IF NOT EXISTS "Archive_caseId_idx" ON "Archive"("caseId");

CREATE INDEX IF NOT EXISTS "Lawyer_name_idx" ON "Lawyer"("name");
CREATE INDEX IF NOT EXISTS "Lawyer_phone_idx" ON "Lawyer"("phone");

CREATE INDEX IF NOT EXISTS "JudicialBody_type_idx" ON "JudicialBody"("type");
CREATE INDEX IF NOT EXISTS "JudicialBody_wilayaId_idx" ON "JudicialBody"("wilayaId");

CREATE INDEX IF NOT EXISTS "CustomOption_field_idx" ON "CustomOption"("field");
