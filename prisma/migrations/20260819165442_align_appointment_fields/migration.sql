-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emergencyContact" TEXT,
    "preferredDate" DATETIME NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "deliveryMode" TEXT NOT NULL,
    "reasonForVisit" TEXT,
    "isReturningClient" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("adminNotes", "createdAt", "dateOfBirth", "deliveryMode", "email", "emergencyContact", "fullName", "id", "isReturningClient", "phone", "preferredDate", "preferredTime", "reasonForVisit", "sessionType", "status", "updatedAt", "userId") SELECT "adminNotes", "createdAt", "dateOfBirth", "deliveryMode", "email", "emergencyContact", "fullName", "id", "isReturningClient", "phone", "preferredDate", "preferredTime", "reasonForVisit", "sessionType", "status", "updatedAt", "userId" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
