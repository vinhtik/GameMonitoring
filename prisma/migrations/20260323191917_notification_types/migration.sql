-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "priceSnapshot" DOUBLE PRECISION,
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'system';
