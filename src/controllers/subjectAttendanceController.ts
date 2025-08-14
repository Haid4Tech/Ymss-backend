import { Request, Response } from "express";
import { prisma } from "../app";

export const getAllSubjectAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await prisma.subjectAttendance.findMany({
      include: {
        enrollment: {
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
        },
      },
    });
    res.json({ attendance, page: 1, limit: 100, total: attendance.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markSubjectAttendance = async (req: Request, res: Response) => {
  const { enrollmentId, date, status } = req.body;
  try {
    const attendance = await prisma.subjectAttendance.create({
      data: { enrollmentId, date: new Date(date), status },
      include: {
        enrollment: {
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
        },
      },
    });
    res.status(201).json(attendance);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAttendanceByEnrollment = async (
  req: Request,
  res: Response
) => {
  const enrollmentId = Number(req.params.enrollmentId);
  const records = await prisma.subjectAttendance.findMany({
    where: { enrollmentId },
    include: {
      enrollment: {
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
      },
    },
  });
  res.json(records);
};

export const getAttendanceBySubject = async (req: Request, res: Response) => {
  const subjectId = Number(req.params.subjectId);
  const records = await prisma.subjectAttendance.findMany({
    where: { enrollment: { subjectId } },
    include: {
      enrollment: {
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
      },
    },
  });
  res.json(records);
};

export const getAttendanceByStudent = async (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId);
  const records = await prisma.subjectAttendance.findMany({
    where: { enrollment: { studentId } },
    include: {
      enrollment: {
        include: {
          subject: {
            include: {
              class: true,
            },
          },
          student: {
            include: {
              user: true,
              class: true,
            },
          },
        },
      },
    },
  });
  res.json(records);
};
