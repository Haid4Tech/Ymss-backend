import { Request, Response } from "express";
import { prisma } from "../app";
import { exclude } from "../utils/helpers";

export const getAllStudents = async (req: Request, res: Response) => {
  // Parse pagination params, with defaults
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const take = limit;

  // Get total count for pagination info
  const total = await prisma.student.count();

  const students = await prisma.student.findMany({
    skip,
    take,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          // Do NOT include password
        },
      },
      class: true,
      parent: true,
    },
  });

  res.json({ students, page, limit, total });
};

export const getStudentById = async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: Number(req.params.id) },
    include: { user: true, class: true, parent: true },
  });

  if (!student) return res.status(404).json({ error: "Student not found" });

  // Exclude password from the user object
  const cleanUser = exclude(student.user, ["password"]);
  res.json({ ...student, user: cleanUser });
};

export const createStudent = async (req: Request, res: Response) => {
  const { userId, classId, parentId, admissionDate, previousSchool } = req.body;
  
  if (!admissionDate) {
    return res.status(400).json({ error: "Admission date is required" });
  }

  const student = await prisma.student.create({
    data: { 
      userId, 
      classId, 
      parentId, 
      admissionDate: new Date(admissionDate),
      previousSchool 
    },
  });
  res.status(201).json(student);
};

export const updateStudent = async (req: Request, res: Response) => {
  const { classId, parentId, admissionDate, previousSchool } = req.body;
  
  const updateData: any = {};
  if (classId) updateData.classId = classId;
  if (parentId) updateData.parentId = parentId;
  if (admissionDate) updateData.admissionDate = new Date(admissionDate);
  if (previousSchool !== undefined) updateData.previousSchool = previousSchool;

  const student = await prisma.student.update({
    where: { id: Number(req.params.id) },
    data: updateData,
  });
  res.json(student);
};

export const deleteStudent = async (req: Request, res: Response) => {
  await prisma.student.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
};
