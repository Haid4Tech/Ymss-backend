import { Request, Response } from "express";
import { prisma } from "../app";

export const getAllSubjects = async (req: Request, res: Response) => {
  const subjects = await prisma.subject.findMany({
    include: {
      class: true,
      enrollments: {
        include: {
          student: { include: { user: true } },
          attendance: true,
        },
      },
      teachers: {
        include: {
          teacher: { include: { user: true } },
        },
      },
    },
  });
  res.json(subjects);
};

export const getSubjectById = async (req: Request, res: Response) => {
  const subject = await prisma.subject.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      class: true,
      enrollments: {
        include: {
          student: { include: { user: true } },
          attendance: true,
        },
      },
      teachers: {
        include: {
          teacher: { include: { user: true } },
        },
      },
    },
  });
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  res.json(subject);
};

export const createSubject = async (req: Request, res: Response) => {
  const { name, classId, description, category, weeklyHours } = req.body;

  if (!name && !description) {
    return res.status(400).json({ error: "Check data" });
  }

  const subject = await prisma.subject.create({
    data: {
      name,
      classId,
      description,
      category,
      weeklyHours,
    },
  });
  res.status(201).json(subject);
};

export const updateSubject = async (req: Request, res: Response) => {
  const { name, classId, description, category, weeklyHours } = req.body;

  const updateData: any = {};
  if (name) updateData.name = name;
  if (classId) updateData.classId = classId;
  if (description) updateData.description = description;
  if (category) updateData.category = category;
  if (weeklyHours) updateData.weeklyHours = weeklyHours;

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

  // Assign teacher to subject via SubjectTeacher join table
  const subjectTeacher = await prisma.subjectTeacher.create({
    data: { subjectId, teacherId },
  });

  res.status(201).json(subjectTeacher);
};

export async function getSubjectByClassId(req: Request, res: Response) {
  const classId = Number(req.params.classId);

  if (isNaN(classId)) {
    return res.status(400).json({ error: "Invalid class ID" });
  }

  try {
    const subjects = await prisma.subject.findMany({
      where: { classId },
      include: {
        class: true,
      },
    });

    return res.status(200).json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
