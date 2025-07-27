import { Request, Response } from "express";

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
