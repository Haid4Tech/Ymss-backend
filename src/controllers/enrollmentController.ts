import { Request, Response } from "express";
import { prisma } from "../app";

export const getAllEnrollments = async (req: Request, res: Response) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        subject: {
          include: {
            class: true,
          },
        },
      },
    });
    res.json({ enrollments, page: 1, limit: 100, total: enrollments.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createEnrollment = async (req: Request, res: Response) => {
  const { studentId, subjectId } = req.body;
  try {
    const enrollment = await prisma.enrollment.create({
      data: { studentId, subjectId },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        subject: {
          include: {
            class: true,
          },
        },
      },
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
    include: {
      subject: {
        include: {
          class: true,
        },
      },
    },
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