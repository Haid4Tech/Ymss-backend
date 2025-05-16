import { Request, Response } from 'express';
import { prisma } from '../app';

export const getAllAttendance = async (req: Request, res: Response) => {
  const attendance = await prisma.attendance.findMany({ include: { student: true } });
  res.json(attendance);
};

export const getAttendanceByStudent = async (req: Request, res: Response) => {
  const attendance = await prisma.attendance.findMany({
    where: { studentId: Number(req.params.studentId) }
  });
  res.json(attendance);
};

export const markAttendance = async (req: Request, res: Response) => {
  const { studentId, date, present } = req.body;
  const attendance = await prisma.attendance.create({
    data: { studentId, date: new Date(date), present }
  });
  res.status(201).json(attendance);
};