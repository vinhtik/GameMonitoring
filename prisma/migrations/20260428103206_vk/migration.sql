/*
  Warnings:

  - You are about to drop the column `telegramChatId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `telegramLinkToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `telegramLinkedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `telegramUsername` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[password]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vkId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vkChatId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vkLinkToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_telegramChatId_key";

-- DropIndex
DROP INDEX "User_telegramLinkToken_key";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "itemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "telegramChatId",
DROP COLUMN "telegramLinkToken",
DROP COLUMN "telegramLinkedAt",
DROP COLUMN "telegramUsername",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vkChatId" TEXT,
ADD COLUMN     "vkId" TEXT,
ADD COLUMN     "vkLinkToken" TEXT,
ADD COLUMN     "vkLinkedAt" TIMESTAMP(3),
ADD COLUMN     "vkUsername" TEXT;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Notification_userId_sentAt_idx" ON "Notification"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "Notification_itemId_idx" ON "Notification"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "User_password_key" ON "User"("password");

-- CreateIndex
CREATE UNIQUE INDEX "User_vkId_key" ON "User"("vkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_vkChatId_key" ON "User"("vkChatId");

-- CreateIndex
CREATE UNIQUE INDEX "User_vkLinkToken_key" ON "User"("vkLinkToken");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
