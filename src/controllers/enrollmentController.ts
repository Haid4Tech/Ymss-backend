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
    // res.json({ enrollments, page: 1, limit: 100, total: enrollments.length });
    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createEnrollment = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (Array.isArray(body)) {
      // Handle bulk enrollment
      const enrollmentsData = body.map(({ studentId, subjectId }) => ({
        studentId,
        subjectId,
      }));

      const created = await prisma.enrollment.createMany({
        data: enrollmentsData,
        skipDuplicates: true, // prevents crashing on duplicates
      });

      return res.status(201).json({
        message: "Bulk enrollment successful",
        count: created.count,
      });
    }

    const { studentId, subjectId } = body;

    if (!studentId || !subjectId) {
      return res
        .status(400)
        .json({ error: "studentId and subjectId are required." });
    }

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

    return res.status(201).json(enrollment);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
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
    include: { student: { include: { user: true, class: true } } },
  });
  res.json(enrollments);
};

export const deleteEnrollment = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.enrollment.delete({ where: { id } });
  res.status(204).send();
};

export const getEnrollmentByClass = async (req: Request, res: Response) => {
  const classId = Number(req.params.classId);

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        student: { classId: classId },
        subject: { classId: classId },
      },
      include: {
        student: true,
        subject: true,
      },
    });

    res.json(enrollments);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
