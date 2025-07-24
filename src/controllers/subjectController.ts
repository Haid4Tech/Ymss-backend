import { Request, Response } from "express";
import { prisma } from "../app";

export const getAllSubjects = async (req: Request, res: Response) => {
  const subjects = await prisma.subject.findMany({
    include: { class: true },
  });
  res.json(subjects);
};

export const getSubjectById = async (req: Request, res: Response) => {
  const subject = await prisma.subject.findUnique({
    where: { id: Number(req.params.id) },
    include: { class: true },
  });
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  res.json(subject);
};

export const createSubject = async (req: Request, res: Response) => {
  const { name, classId, previousSchool } = req.body;
  const subject = await prisma.subject.create({
    data: { name, classId, previousSchool },
  });
  res.status(201).json(subject);
};

export const updateSubject = async (req: Request, res: Response) => {
  const { name, classId, previousSchool } = req.body;

  const updateData: any = {};
  if (name) updateData.name = name;
  if (classId) updateData.classId = classId;
  if (previousSchool !== undefined) updateData.previousSchool = previousSchool;

  const subject = await prisma.subject.update({
    where: { id: Number(req.params.id) },
    data: updateData,
  });
  res.json(subject);
};

export const deleteSubject = async (req: Request, res: Response) => {
  await prisma.subject.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
};

export const assignTeacherToSubject = async (req: Request, res: Response) => {
  const subjectId = Number(req.params.subjectId);
  const { teacherId } = req.body;

  // Check if subject exists
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    return res.status(404).json({ error: "Subject not found" });
  }

  // Check if teacher exists
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) {
    return res.status(404).json({ error: "Teacher not found" });
  }

  // Assign teacher to subject
  const updatedSubject = await prisma.subject.update({
    where: { id: subjectId },
    data: { teacherId },
  });

  res.json(updatedSubject);
};
