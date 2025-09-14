import { Request, Response } from "express";
import { prisma } from "../app";

export function exclude<T, Key extends keyof T>(
  user: T,
  keys: Key[]
): Omit<T, Key> {
  for (let key of keys) {
    delete user[key];
  }
  return user;
}

export async function checkStudentAccess(
  role: string,
  authenticatedUserId: number,
  studentUserId: number
) {
  if (role !== "ADMIN" && role !== "TEACHER") {
    if (authenticatedUserId !== studentUserId) {
      return false;
    }
  }

  return true;
}

export const extractErrorMessage = (error: any): string => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error || // sometimes APIs use "error"
    error?.message ||
    "An unexpected error occurred"
  );
};

export async function checkTeacherClassAccess(
  teacherUserId: number,
  classId: number
): Promise<boolean> {
  try {
    // Check if teacher is directly assigned to the class
    const directAssignment = await prisma.class.findFirst({
      where: {
        id: classId,
        teacher: {
          userId: teacherUserId,
        },
      },
    });

    if (directAssignment) {
      return true;
    }

    // Check if teacher teaches any subjects in this class
    const subjectAssignment = await prisma.subjectTeacher.findFirst({
      where: {
        teacher: {
          userId: teacherUserId,
        },
        subject: {
          classId: classId,
        },
      },
    });

    return !!subjectAssignment;
  } catch (error) {
    console.error("Error checking teacher class access:", error);
    return false;
  }
}
