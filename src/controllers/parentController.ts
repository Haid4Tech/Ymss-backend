import { Request, Response } from "express";
import { prisma } from "../app";
import { exclude } from "../utils/helpers";
import { User, Student, Parent } from "../common/types";

export const getAllParents = async (req: Request, res: Response) => {
  const parents = await prisma.parent.findMany({
    include: { user: true, students: true },
  });

  (parents as Parent[]).forEach((parent: Parent) => {
    (parent.user as User).password = "";
  });
  res.json(parents);
};

export const getParentById = async (req: Request, res: Response) => {
  const parent = await prisma.parent.findUnique({
    where: { id: Number(req.params.id) },
    include: { user: true, students: true },
  });
  if (!parent) return res.status(404).json({ error: "Parent not found" });

  // Exclude password from the user object
  const cleanUser = exclude(parent.user, ["password"]);

  res.json({ ...parent, user: cleanUser });
};

export const createParent = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const parent = await prisma.parent.create({ data: { userId } });
  res.status(201).json(parent);
};

export const updateParent = async (req: Request, res: Response) => {
  // Only userId can be updated here
  const { userId } = req.body;
  const parent = await prisma.parent.update({
    where: { id: Number(req.params.id) },
    data: { userId },
  });
  res.json(parent);
};

export const deleteParent = async (req: Request, res: Response) => {
  await prisma.parent.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
};
