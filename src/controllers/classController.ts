import { Request, Response } from "express";
import { prisma } from "../app";
import { checkTeacherClassAccess } from "../utils/helpers";

export const getAllClasses = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const role = (req as any).role;

  // If user is admin, return all classes
  if (role === "ADMIN") {
    const classes = await prisma.class.findMany({
      include: {
        students: true,
        subjects: true,
        teacher: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
      },
    });
    return res.json(classes);
  }

  // If user is student, return only their class
  if (role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: userId },
      select: { classId: true },
    });

    if (!student) {
      return res.json([]);
    }

    const classes = await prisma.class.findMany({
      where: {
        id: student.classId,
      },
      include: {
        students: true,
        subjects: true,
        teacher: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
      },
    });
    return res.json(classes);
  }

  // If user is parent, return classes of their children
  if (role === "PARENT") {
    // First get the parent record
    const parent = await prisma.parent.findUnique({
      where: { userId: userId },
      select: { id: true },
    });

    if (!parent) {
      return res.json([]);
    }

    // Get all students of this parent
    const parentStudents = await prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      select: { student: { select: { classId: true } } },
    });

    if (parentStudents.length === 0) {
      return res.json([]);
    }

    // Extract unique class IDs
    const classIds = [...new Set(parentStudents.map(ps => ps.student.classId))];

    const classes = await prisma.class.findMany({
      where: {
        id: { in: classIds },
      },
      include: {
        students: true,
        subjects: true,
        teacher: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
      },
    });
    return res.json(classes);
  }

  // If user is teacher, only return classes they have access to
  if (role === "TEACHER") {
    const classes = await prisma.class.findMany({
      where: {
        OR: [
          // Direct assignment as class teacher
          {
            teacher: {
              userId: userId,
            },
          },
          // Teaching subjects in this class
          {
            subjects: {
              some: {
                teachers: {
                  some: {
                    teacher: {
                      userId: userId,
                    },
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        students: true,
        subjects: true,
        teacher: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
      },
    });
    return res.json(classes);
  }

  // For other roles, return empty array
  return res.json([]);
};

export const getClassById = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const role = (req as any).role;
  const classId = Number(req.params.id);

  // Check if class exists
  const classObj = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      students: {
        include: {
          user: true,
        },
      },
      subjects: true,
    },
  });

  if (!classObj) {
    return res.status(404).json({ error: "Class not found" });
  }

  // If user is admin, return the class
  if (role === "ADMIN") {
    return res.json(classObj);
  }

  // If user is teacher, check if they have access to this class
  if (role === "TEACHER") {
    const hasAccess = await checkTeacherClassAccess(userId, classId);
    if (!hasAccess) {
      return res.status(403).json({
        error: "Forbidden: You don't have access to this class",
      });
    }
    return res.json(classObj);
  }

  // If user is student, check if they belong to this class
  if (role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: userId },
      select: { classId: true },
    });

    if (!student || student.classId !== classId) {
      return res.status(403).json({
        error: "Forbidden: You don't have access to this class",
      });
    }
    return res.json(classObj);
  }

  // If user is parent, check if any of their children belong to this class
  if (role === "PARENT") {
    // First get the parent record
    const parent = await prisma.parent.findUnique({
      where: { userId: userId },
      select: { id: true },
    });

    if (!parent) {
      return res.status(403).json({
        error: "Forbidden: You don't have access to this class",
      });
    }

    // Check if any of the parent's children are in this class
    const parentStudentInClass = await prisma.parentStudent.findFirst({
      where: {
        parentId: parent.id,
        student: {
          classId: classId,
        },
      },
    });

    if (!parentStudentInClass) {
      return res.status(403).json({
        error: "Forbidden: You don't have access to this class",
      });
    }
    return res.json(classObj);
  }

  // For other roles, deny access
  return res.status(403).json({
    error: "Forbidden: You don't have access to this class",
  });
};

export const createClass = async (req: Request, res: Response) => {
  try {
    const {
      name,
      capacity,
      roomNumber,
      description,
      academicYear,
      schedule,
      exams,
      teacherId,
    } = req.body;

    const { startDate, endDate, startTime, endTime, days } = schedule;

    const parsedStartDate = new Date(startDate).toISOString();
    const parsedEndDate = new Date(endDate).toISOString();

    const classObj = await prisma.class.create({
      data: {
        name,
        capacity,
        roomNumber,
        description,
        academicYear,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        startTime,
        endTime,
        days,
        exams,
        teacherId,
      },
    });
    res.status(201).json(classObj);
  } catch (error) {
    return error;
  }
};

export const updateClass = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const role = (req as any).role;
  const classId = Number(req.params.id);

  // Only admins can update classes
  if (role !== "ADMIN") {
    return res.status(403).json({
      error: "Forbidden: Only admins can update classes",
    });
  }

  const { name, teacherId } = req.body;
  const classObj = await prisma.class.update({
    where: { id: classId },
    data: { name },
  });
  res.json(classObj);
};

export const deleteClass = async (req: Request, res: Response) => {
  const role = (req as any).role;

  // Only admins can delete classes
  if (role !== "ADMIN") {
    return res.status(403).json({
      error: "Forbidden: Only admins can delete classes",
    });
  }

  await prisma.class.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
};
