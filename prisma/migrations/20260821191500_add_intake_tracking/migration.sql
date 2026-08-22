-- AlterTable: add durable intake-completion tracking (existing users unaffected)
ALTER TABLE "User" ADD COLUMN "intakeCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "intakeReminderLastSentAt" TIMESTAMP(3);