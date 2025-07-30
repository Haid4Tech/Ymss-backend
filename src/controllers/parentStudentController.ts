import { Request, Response } from "express";
import { prisma } from "../app";

export const assignParentToStudent = async (req: Request, res: Response) => {
  const { parentId, studentId } = req.body;
  try {
    const relation = await prisma.parentStudent.create({
      data: { parentId, studentId },
    });
    res.status(201).json(relation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const removeParentFromStudent = async (req: Request, res: Response) => {
  const { parentId, studentId } = req.body;
  await prisma.parentStudent.delete({
    where: { parentId_studentId: { parentId, studentId } },
  });
  res.status(204).send();
};

export const getStudentsForParent = async (req: Request, res: Response) => {
  const parentId = Number(req.params.parentId);
  const students = await prisma.parentStudent.findMany({
    where: { parentId },
    include: { student: { include: { user: true, class: true } } },
  });
  res.json(students);
};

export const getParentsForStudent = async (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId);
  const parents = await prisma.parentStudent.findMany({
    where: { studentId },
    include: { parent: { include: { user: true } } },
  });
  res.json(parents);
};
