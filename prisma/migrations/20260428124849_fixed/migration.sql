/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `vkChatId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `vkLinkToken` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[passwordHash]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vkPeerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vkLinkCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_password_key";

-- DropIndex
DROP INDEX "User_vkChatId_key";

-- DropIndex
DROP INDEX "User_vkLinkToken_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
DROP COLUMN "vkChatId",
DROP COLUMN "vkLinkToken",
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "vkLinkCode" TEXT,
ADD COLUMN     "vkPeerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordHash_key" ON "User"("passwordHash");

-- CreateIndex
CREATE UNIQUE INDEX "User_vkPeerId_key" ON "User"("vkPeerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_vkLinkCode_key" ON "User"("vkLinkCode");
