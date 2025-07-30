import { Request, Response } from "express";
import { prisma } from "../app";

export const createEnrollment = async (req: Request, res: Response) => {
  const { studentId, subjectId } = req.body;
  try {
    const enrollment = await prisma.enrollment.create({
      data: { studentId, subjectId }
    });
    res.status(201).json(enrollment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getEnrollmentsByStudent = async (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId);
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: { subject: true }
  });
  res.json(enrollments);
};

export const getEnrollmentsBySubject = async (req: Request, res: Response) => {
  const subjectId = Number(req.params.subjectId);
  const enrollments = await prisma.enrollment.findMany({
    where: { subjectId },
    include: { student: { include: { user: true } } }
  });
  res.json(enrollments);
};

export const deleteEnrollment = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.enrollment.delete({ where: { id } });
  res.status(204).send();
}; 