-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "phone2" TEXT DEFAULT '',
    "address" TEXT DEFAULT '',
    "wilaya" INTEGER DEFAULT 16,
    "nationalId" TEXT DEFAULT '',
    "notes" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" SERIAL NOT NULL,
    "caseNumber" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "caseNature" TEXT DEFAULT '',
    "litigationStage" TEXT DEFAULT '',
    "origCaseNumber" TEXT DEFAULT '',
    "customStage" TEXT DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'جارية',
    "clientId" INTEGER,
    "wilayaId" INTEGER DEFAULT 16,
    "judiciaryType" TEXT,
    "courtLevel" TEXT,
    "courtId" INTEGER,
    "chamber" TEXT DEFAULT '',
    "chamberNumber" INTEGER,
    "councilName" TEXT DEFAULT '',
    "courtName" TEXT DEFAULT '',
    "totalFees" INTEGER DEFAULT 0,
    "paidAmount" INTEGER DEFAULT 0,
    "registrationDate" TEXT DEFAULT '',
    "firstSessionDate" TEXT DEFAULT '',
    "delibDate" TEXT DEFAULT '',
    "barPhone" TEXT DEFAULT '',
    "lawyer" TEXT DEFAULT '',
    "notes" TEXT DEFAULT '',
    "judgment" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Party" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "role" TEXT DEFAULT '',
    "name" TEXT DEFAULT '',
    "phone" TEXT DEFAULT '',
    "lawyerName" TEXT DEFAULT '',
    "lawyerPhone" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delay" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "delayDate" TEXT DEFAULT '',
    "reason" TEXT DEFAULT '',
    "notes" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER,
    "caseNumber" TEXT DEFAULT '',
    "date" TEXT DEFAULT '',
    "time" TEXT DEFAULT '',
    "court" TEXT DEFAULT '',
    "chamber" TEXT DEFAULT '',
    "roomNumber" TEXT DEFAULT '',
    "notes" TEXT DEFAULT '',
    "status" TEXT DEFAULT 'scheduled',
    "result" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER,
    "caseNumber" TEXT DEFAULT '',
    "amount" INTEGER DEFAULT 0,
    "type" TEXT DEFAULT 'income',
    "category" TEXT DEFAULT '',
    "date" TEXT DEFAULT '',
    "notes" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archive" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "caseData" TEXT NOT NULL DEFAULT '',
    "archiveDate" TEXT NOT NULL DEFAULT '',
    "reason" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudicialBody" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT '',
    "wilayaId" INTEGER DEFAULT 16,
    "parentCouncilId" INTEGER,
    "chambers" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JudicialBody_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delay" ADD CONSTRAINT "Delay_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archive" ADD CONSTRAINT "Archive_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
