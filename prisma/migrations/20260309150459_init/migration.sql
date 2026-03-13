/*
  Warnings:

  - You are about to drop the column `towerId` on the `Flat` table. All the data in the column will be lost.
  - Added the required column `wingId` to the `Flat` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Wing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "towerId" TEXT NOT NULL,
    CONSTRAINT "Wing_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "Tower" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Flat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "wingId" TEXT NOT NULL,
    CONSTRAINT "Flat_wingId_fkey" FOREIGN KEY ("wingId") REFERENCES "Wing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Flat" ("floor", "id", "number") SELECT "floor", "id", "number" FROM "Flat";
DROP TABLE "Flat";
ALTER TABLE "new_Flat" RENAME TO "Flat";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
