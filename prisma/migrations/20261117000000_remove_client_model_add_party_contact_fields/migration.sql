-- Convert the former Client record into a represented Party per linked case.
-- Preserve contact fields before dropping the legacy Client table.
ALTER TABLE "Party"
  ADD COLUMN "phone2" VARCHAR(40) DEFAULT '',
  ADD COLUMN "address" TEXT,
  ADD COLUMN "wilaya" INTEGER DEFAULT 16,
  ADD COLUMN "nationalId" TEXT,
  ADD COLUMN "contactNotes" TEXT;

-- Enrich an already existing represented party with legacy contact data.
UPDATE "Party" AS p
SET
  "phone" = COALESCE(NULLIF(p."phone", ''), cl."phone"),
  "phone2" = COALESCE(NULLIF(p."phone2", ''), cl."phone2"),
  "address" = COALESCE(NULLIF(p."address", ''), cl."address"),
  "wilaya" = cl."wilaya",
  "nationalId" = COALESCE(NULLIF(p."nationalId", ''), cl."nationalId"),
  "contactNotes" = COALESCE(NULLIF(p."contactNotes", ''), cl."notes")
FROM "Case" AS c
JOIN "Client" AS cl ON cl."id" = c."clientId"
WHERE p."caseId" = c."id"
  AND COALESCE(p."side", 'for') = 'for'
  AND LOWER(COALESCE(p."name", '')) = LOWER(COALESCE(cl."name", ''));

-- Create the represented party when the case does not already contain it.
INSERT INTO "Party" (
  "caseId", "role", "side", "name", "phone", "lawyerName", "lawyerPhone",
  "totalFees", "paidAmount", "phone2", "address", "wilaya", "nationalId",
  "contactNotes", "createdAt", "updatedAt"
)
SELECT
  c."id", NULL, 'for', cl."name", cl."phone", '', '',
  0, 0, cl."phone2", cl."address", cl."wilaya", cl."nationalId",
  cl."notes", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Case" AS c
JOIN "Client" AS cl ON cl."id" = c."clientId"
WHERE NOT EXISTS (
  SELECT 1
  FROM "Party" AS p
  WHERE p."caseId" = c."id"
    AND p."side" = 'for'
    AND LOWER(COALESCE(p."name", '')) = LOWER(COALESCE(cl."name", ''))
);

-- Preserve legacy people that have no linked case in a migration-only
-- settings payload so their data is not silently discarded. Google Drive
-- folder identifiers are intentionally excluded by product requirement.
INSERT INTO "Setting" ("key", "value")
SELECT
  'legacyUnassignedPartyData',
  COALESCE(json_agg(json_build_object(
    'name', cl."name",
    'phone', cl."phone",
    'phone2', cl."phone2",
    'address', cl."address",
    'wilaya', cl."wilaya",
    'nationalId', cl."nationalId",
    'notes', cl."notes"
  )), '[]'::json)::text
FROM "Client" AS cl
WHERE NOT EXISTS (SELECT 1 FROM "Case" AS c WHERE c."clientId" = cl."id")
HAVING COUNT(*) > 0
ON CONFLICT ("key") DO UPDATE
SET "value" = EXCLUDED."value";

-- Tasks previously linked only to a client are attached to a case only when
-- that client belongs to exactly one case. Ambiguous associations are retained
-- in the task notes rather than assigned to an arbitrary case.
WITH client_case_counts AS (
  SELECT "clientId", MIN("id") AS "onlyCaseId", COUNT(*) AS "caseCount"
  FROM "Case"
  WHERE "clientId" IS NOT NULL
  GROUP BY "clientId"
)
UPDATE "Task" AS t
SET "relatedCaseId" = cc."onlyCaseId"
FROM client_case_counts AS cc
WHERE t."relatedClientId" = cc."clientId"
  AND t."relatedCaseId" IS NULL
  AND cc."caseCount" = 1;

UPDATE "Task" AS t
SET "notes" = CONCAT_WS(
  E'\n',
  NULLIF(t."notes", ''),
  'ارتباط سابق ببيانات شخص: ' || COALESCE(cl."name", '') ||
    CASE WHEN COALESCE(cl."phone", '') <> '' THEN ' — الهاتف: ' || cl."phone" ELSE '' END
)
FROM "Client" AS cl
WHERE t."relatedClientId" = cl."id"
  AND t."relatedCaseId" IS NULL;

DROP INDEX IF EXISTS "Case_clientId_idx";
DROP INDEX IF EXISTS "Task_relatedClientId_idx";
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_relatedClientId_fkey";
ALTER TABLE "Case" DROP CONSTRAINT IF EXISTS "Case_clientId_fkey";
ALTER TABLE "Task" DROP COLUMN IF EXISTS "relatedClientId";
ALTER TABLE "Case" DROP COLUMN IF EXISTS "clientId";
DROP TABLE "Client";
