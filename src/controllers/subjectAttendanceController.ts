import { Request, Response } from "express";
import { prisma } from "../app";

export const markSubjectAttendance = async (req: Request, res: Response) => {
  const { enrollmentId, date, status } = req.body;
  try {
    const attendance = await prisma.subjectAttendance.create({
      data: { enrollmentId, date: new Date(date), status },
    });
    res.status(201).json(attendance);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAttendanceByEnrollment = async (
  req: Request,
  res: Response
) => {
  const enrollmentId = Number(req.params.enrollmentId);
  const records = await prisma.subjectAttendance.findMany({
    where: { enrollmentId },
  });
  res.json(records);
};

export const getAttendanceBySubject = async (req: Request, res: Response) => {
  const subjectId = Number(req.params.subjectId);
  const records = await prisma.subjectAttendance.findMany({
    where: { enrollment: { subjectId } },
    include: {
      enrollment: { include: { student: { include: { user: true } } } },
    },
  });
  res.json(records);
};

export const getAttendanceByStudent = async (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId);
  const records = await prisma.subjectAttendance.findMany({
    where: { enrollment: { studentId } },
    include: { enrollment: { include: { subject: true } } },
  });
  res.json(records);
};
