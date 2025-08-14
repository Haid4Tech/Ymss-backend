import { Request, Response } from 'express';
import { prisma } from '../app';

// Get all subject attendance records (with student and subject info)
export const getAllSubjectAttendance = async (req: Request, res: Response) => {
  const attendance = await prisma.subjectAttendance.findMany({
    include: {
      enrollment: {
        include: {
          student: { include: { user: true } },
          subject: true,
        },
      },
    },
  });
  res.json(attendance);
};

// Get subject attendance records for a specific student
export const getSubjectAttendanceByStudent = async (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId);
  const attendance = await prisma.subjectAttendance.findMany({
    where: {
      enrollment: { studentId },
    },
    include: {
      enrollment: {
        include: {
          subject: true,
        },
      },
    },
  });
  res.json(attendance);
};

// Mark attendance for a student in a subject (by enrollment)
export const markSubjectAttendance = async (req: Request, res: Response) => {
  const { enrollmentId, date, status } = req.body;
  const attendance = await prisma.subjectAttendance.create({
    data: { enrollmentId, date: new Date(date), status },
  });
  res.status(201).json(attendance);
};