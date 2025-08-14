/*
  Warnings:

  - You are about to drop the column `parentId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `gradeId` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the `Attendance` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `capacity` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomNumber` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relationship` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Made the column `classId` on table `Subject` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_classId_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_teacherId_fkey";

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "attachments" TEXT[],
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "emailNotification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "priority" TEXT,
ADD COLUMN     "publishDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sendNotification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "smsNotification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetAudience" TEXT;

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "capacity" INTEGER NOT NULL,
ADD COLUMN     "days" TEXT[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "roomNumber" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startTime" TEXT,
ADD COLUMN     "teacherId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "parentId",
ADD COLUMN     "relationship" TEXT NOT NULL,
ALTER COLUMN "admissionDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "gradeId",
DROP COLUMN "teacherId",
ALTER COLUMN "classId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "previousInstitution" DROP NOT NULL;

-- DropTable
DROP TABLE "Attendance";

-- CreateTable
CREATE TABLE "ParentStudent" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,

    CONSTRAINT "ParentStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectTeacher" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,

    CONSTRAINT "SubjectTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectAttendance" (
    "id" SERIAL NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,

    CONSTRAINT "SubjectAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParentStudent_parentId_studentId_key" ON "ParentStudent"("parentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectTeacher_subjectId_teacherId_key" ON "SubjectTeacher"("subjectId", "teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_subjectId_key" ON "Enrollment"("studentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectAttendance_enrollmentId_date_key" ON "SubjectAttendance"("enrollmentId", "date");

-- AddForeignKey
ALTER TABLE "ParentStudent" ADD CONSTRAINT "ParentStudent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudent" ADD CONSTRAINT "ParentStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectTeacher" ADD CONSTRAINT "SubjectTeacher_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectTeacher" ADD CONSTRAINT "SubjectTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAttendance" ADD CONSTRAINT "SubjectAttendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
