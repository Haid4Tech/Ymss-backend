import { Request, Response } from "express";
import { prisma } from "../app";

export const assignTeacherToSubject = async (req: Request, res: Response) => {
  const { subjectId, teacherId } = req.body;
  try {
    const relation = await prisma.subjectTeacher.create({
      data: { subjectId, teacherId },
    });
    res.status(201).json(relation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const removeTeacherFromSubject = async (req: Request, res: Response) => {
  const { subjectId, teacherId } = req.body;
  await prisma.subjectTeacher.delete({
    where: { subjectId_teacherId: { subjectId, teacherId } },
  });
  res.status(204).send();
};

export const getTeachersForSubject = async (req: Request, res: Response) => {
  const subjectId = Number(req.params.subjectId);
  const teachers = await prisma.subjectTeacher.findMany({
    where: { subjectId },
    include: { teacher: { include: { user: true } } },
  });
  res.json(teachers);
};

export const getSubjectsForTeacher = async (req: Request, res: Response) => {
  const teacherId = Number(req.params.teacherId);
  const subjects = await prisma.subjectTeacher.findMany({
    where: { teacherId },
    include: { subject: true },
  });
  res.json(subjects);
}; 