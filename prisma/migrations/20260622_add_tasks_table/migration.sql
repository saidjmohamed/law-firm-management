-- ============================================================================
-- Migration: إضافة جدول المهام (Tasks) والإجراءات القانونية
-- التاريخ: 2026-06-22
-- آمنة: تضيف جدولاً جديداً فقط بدون لمس الجداول الموجودة
-- ============================================================================

CREATE TABLE "Task" (
    "id"              SERIAL PRIMARY KEY,
    "title"           TEXT         NOT NULL DEFAULT '',
    "description"     TEXT         DEFAULT '',
    "taskType"        TEXT         NOT NULL DEFAULT 'other',
    "priority"        TEXT         NOT NULL DEFAULT 'medium',
    "status"          TEXT         NOT NULL DEFAULT 'pending',
    "dueDate"         TIMESTAMP(3),
    "startDate"       TIMESTAMP(3),
    "legalDeadline"   TIMESTAMP(3),
    "reminderOffsets" TEXT         DEFAULT '[]',
    "sourceType"      TEXT         DEFAULT 'manual',
    "sourceId"        INTEGER,
    "relatedCaseId"   INTEGER,
    "relatedClientId" INTEGER,
    "assignedTo"      TEXT,
    "notes"           TEXT,
    "completedAt"     TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- العلاقات (مع SetNull عند حذف القضية/الموكل)
ALTER TABLE "Task"
  ADD CONSTRAINT "Task_relatedCaseId_fkey"
  FOREIGN KEY ("relatedCaseId") REFERENCES "Case"("id") ON DELETE SET NULL;

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_relatedClientId_fkey"
  FOREIGN KEY ("relatedClientId") REFERENCES "Client"("id") ON DELETE SET NULL;

-- الفهارس
CREATE INDEX "Task_relatedCaseId_idx"   ON "Task"("relatedCaseId");
CREATE INDEX "Task_relatedClientId_idx" ON "Task"("relatedClientId");
CREATE INDEX "Task_status_idx"          ON "Task"("status");
CREATE INDEX "Task_priority_idx"        ON "Task"("priority");
CREATE INDEX "Task_dueDate_idx"         ON "Task"("dueDate");
CREATE INDEX "Task_legalDeadline_idx"   ON "Task"("legalDeadline");
CREATE INDEX "Task_taskType_idx"        ON "Task"("taskType");
CREATE INDEX "Task_sourceType_sourceId_idx" ON "Task"("sourceType", "sourceId");
