/*
  Warnings:

  - You are about to drop the `AmenityBooking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VisitorLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `Complaint` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Flat` table. All the data in the column will be lost.
  - You are about to drop the column `residentId` on the `Flat` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `MaintenanceBill` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `MaintenanceBill` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `MaintenanceBill` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Tower` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AmenityBooking";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Notice";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VisitorLog";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Resident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    CONSTRAINT "Resident_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "residentId" TEXT NOT NULL,
    CONSTRAINT "Complaint_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Complaint" ("description", "id", "residentId", "status", "title") SELECT "description", "id", "residentId", "status", "title" FROM "Complaint";
DROP TABLE "Complaint";
ALTER TABLE "new_Complaint" RENAME TO "Complaint";
CREATE TABLE "new_Flat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "towerId" TEXT NOT NULL,
    CONSTRAINT "Flat_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "Tower" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Flat" ("floor", "id", "number", "towerId") SELECT "floor", "id", "number", "towerId" FROM "Flat";
DROP TABLE "Flat";
ALTER TABLE "new_Flat" RENAME TO "Flat";
CREATE TABLE "new_MaintenanceBill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "residentId" TEXT NOT NULL,
    CONSTRAINT "MaintenanceBill_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MaintenanceBill" ("amount", "id", "month", "residentId", "status") SELECT "amount", "id", "month", "residentId", "status" FROM "MaintenanceBill";
DROP TABLE "MaintenanceBill";
ALTER TABLE "new_MaintenanceBill" RENAME TO "MaintenanceBill";
CREATE TABLE "new_Tower" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Tower" ("id", "name") SELECT "id", "name" FROM "Tower";
DROP TABLE "Tower";
ALTER TABLE "new_Tower" RENAME TO "Tower";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Resident_email_key" ON "Resident"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_flatId_key" ON "Resident"("flatId");
