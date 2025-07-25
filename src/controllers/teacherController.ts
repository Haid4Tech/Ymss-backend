import { Request, Response } from "express";
import { prisma } from "../app";
import { exclude } from "../utils/helpers";
import bcrypt from "bcrypt";

export const getAllTeachers = async (req: Request, res: Response) => {
  // Parse pagination params, with defaults
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const take = limit;

  // Get total count for pagination info
  const total = await prisma.teacher.count();

  const teachers = await prisma.teacher.findMany({
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
      subjects: true,
    },
  });

  res.json({ teachers, page, limit, total });
};

export const getTeacherById = async (req: Request, res: Response) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: Number(req.params.id) },
    include: { user: true, subjects: true },
  });
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });

  // Exclude password from the user object
  const cleanUser = exclude(teacher.user, ["password"]);
  res.json({ ...teacher, user: cleanUser });
};

export const createTeacher = async (req: Request, res: Response) => {
  const {
    userId,
    name,
    email,
    DOB,
    password,
    hireDate,
    previousInstitution,
    experience,
    employmentType,
    salary,
    degree,
    university,
    graduationYear,
  } = req.body;

  const result = await prisma.$transaction(async (tsx) => {
    // Create the user first
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash(
          `${name.split(" ")[0].toLowerCase()}${new Date(DOB).getFullYear()}`,
          10
        );

    const user = tsx.user.create({
      data: {
        name,
        email,
        DOB,
        password: hashedPassword,
        role: "TEACHER",
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId,
        hireDate,
        previousInstitution,
        experience,
        employmentType,
        salary,
        degree,
        university,
        graduationYear,
      },
    });

    return { teacher, user };
  });

  res.status(201).json(result);
};

export const updateTeacher = async (req: Request, res: Response) => {
  const {
    userId,
    hireDate,
    previousInstitution,
    experience,
    employmentType,
    salary,
    degree,
    university,
    graduationYear,
  } = req.body;

  const updateData: any = {};
  if (userId) updateData.userId = userId;
  if (graduationYear) updateData.graduationYear = graduationYear;
  if (university) updateData.university = university;
  if (degree) updateData.degree = degree;
  if (salary) updateData.salary = salary;
  if (employmentType) updateData.employmentType = employmentType;
  if (experience) updateData.experience = experience;
  if (previousInstitution) updateData.previousInstitution = previousInstitution;
  if (hireDate !== null || hireDate !== undefined)
    updateData.hireDate = new Date(hireDate);

  const teacher = await prisma.teacher.update({
    where: { id: Number(req.params.id) },
    data: updateData,
  });
  res.json(teacher);
};

export const deleteTeacher = async (req: Request, res: Response) => {
  await prisma.teacher.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
};
