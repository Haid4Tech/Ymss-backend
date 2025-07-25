/*
  Warnings:

  - You are about to drop the column `previousSchool` on the `Subject` table. All the data in the column will be lost.
  - Added the required column `examType` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `previousInstitution` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "examType" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL,
ADD COLUMN     "teacherId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "previousSchool",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "gradeId" INTEGER,
ADD COLUMN     "weeklyHours" INTEGER;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "degree" TEXT,
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "graduationYear" TEXT,
ADD COLUMN     "hireDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "previousInstitution" TEXT NOT NULL,
ADD COLUMN     "salary" INTEGER,
ADD COLUMN     "university" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
