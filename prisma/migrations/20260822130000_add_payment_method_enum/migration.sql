-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'PAYPAL', 'PAYONEER', 'OTHER');

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "paymentMethod",
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT E'CASH';