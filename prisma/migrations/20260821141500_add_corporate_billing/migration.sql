-- CreateEnum
CREATE TYPE "BillingFrequency" AS ENUM ('WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'MANUAL');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "billingAddress" TEXT,
    "billingFrequency" "BillingFrequency" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add corporate billing columns (existing data preserved)
ALTER TABLE "User" ADD COLUMN "companyId" TEXT;

ALTER TABLE "Invoice" ADD COLUMN "companyId" TEXT;

ALTER TABLE "InvoiceItem" ADD COLUMN "employeeId" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN "appointmentId" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN "sessionDate" TIMESTAMP(3);
ALTER TABLE "InvoiceItem" ADD COLUMN "serviceType" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN "note" TEXT;

-- CreateIndex
CREATE INDEX "Company_companyName_idx" ON "Company"("companyName");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "Invoice_companyId_idx" ON "Invoice"("companyId");

-- CreateIndex
CREATE INDEX "InvoiceItem_employeeId_idx" ON "InvoiceItem"("employeeId");

-- CreateIndex
CREATE INDEX "InvoiceItem_appointmentId_idx" ON "InvoiceItem"("appointmentId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;