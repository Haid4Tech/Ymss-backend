import { Request, Response } from "express";
import { prisma } from "../app";

export const getAllClasses = async (req: Request, res: Response) => {
  const classes = await prisma.class.findMany({
    include: { students: true, subjects: true },
  });
  res.json(classes);
};

export const getClassById = async (req: Request, res: Response) => {
  const classObj = await prisma.class.findUnique({
    where: { id: Number(req.params.id) },
    include: { students: true, subjects: true },
  });
  if (!classObj) return res.status(404).json({ error: "Class not found" });
  res.json(classObj);
};

export const createClass = async (req: Request, res: Response) => {
  const { name } = req.body;
  const classObj = await prisma.class.create({ data: { name } });
  res.status(201).json(classObj);
};

export const updateClass = async (req: Request, res: Response) => {
  const { name, teacherId } = req.body;
  const classObj = await prisma.class.update({
    where: { id: Number(req.params.id) },
    data: { name },
  });
  res.json(classObj);
};

export const deleteClass = async (req: Request, res: Response) => {
  await prisma.class.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
};
