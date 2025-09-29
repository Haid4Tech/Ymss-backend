import { Request, Response } from "express";
import { prisma } from "../app";

export const getAllSubjects = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const role = (req as any).role;

  try {
    if (role === "ADMIN") {
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

      return res.json(subjects);
    }

    if (role === "TEACHER") {
      // Teachers can only see subjects they are assigned to teach
      const subjects = await prisma.subject.findMany({
        where: {
          teachers: {
            some: {
              teacher: {
                userId: userId,
              },
            },
          },
        },
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

      return res.json(subjects);
    }

    if (role === "STUDENT") {
      // Students can only see subjects from their class
      const student = await prisma.student.findFirst({
        where: { userId: userId },
        select: { classId: true },
      });

      if (!student || !student.classId) {
        return res.status(403).json({
          error: "Student record not found or not assigned to a class",
        });
      }

      const subjects = await prisma.subject.findMany({
        where: {
          classId: student.classId,
        },
        include: {
          class: true,
          teachers: {
            include: {
              teacher: { include: { user: true } },
            },
          },
        },
      });

      return res.json(subjects);
    }

    if (role === "PARENT") {
      // Parents can only see subjects from their children's classes
      const parent = await prisma.parent.findFirst({
        where: { userId: userId },
        select: { id: true },
      });

      if (!parent) {
        return res.status(403).json({ error: "Parent record not found" });
      }

      // Get all students of this parent
      const parentStudents = await prisma.parentStudent.findMany({
        where: { parentId: parent.id },
        select: { student: { select: { classId: true } } },
      });

      if (parentStudents.length === 0) {
        return res.json([]);
      }

      // Extract unique class IDs, filtering out null values
      const classIds = [
        ...new Set(
          parentStudents
            .map((ps) => ps.student.classId)
            .filter((id): id is number => id !== null)
        ),
      ];

      if (classIds.length === 0) {
        return res.json([]);
      }

      const subjects = await prisma.subject.findMany({
        where: {
          classId: { in: classIds },
        },
        include: {
          class: true,
          teachers: {
            include: {
              teacher: { include: { user: true } },
            },
          },
        },
      });

      return res.json(subjects);
    }

    // For other roles, return empty array
    return res.json([]);
  } catch (error: any) {
    console.error("Error in getAllSubjects:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getSubjectByIdTest = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const role = (req as any).role;
  const subjectId = Number(req.params.id);

  console.log(
    "getSubjectByIdTest - userId:",
    userId,
    "role:",
    role,
    "subjectId:",
    subjectId
  );

  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
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

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    console.log("Subject found:", subject.name, "classId:", subject.classId);
    console.log("Allowing access for testing purposes");

    return res.json(subject);
  } catch (error: any) {
    console.error("Error in getSubjectByIdTest:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getSubjectById = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const role = (req as any).role;
  const subjectId = Number(req.params.id);

  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
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

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    console.log("Subject found:", subject.name, "classId:", subject.classId);

    // Check access permissions based on role
    if (role === "ADMIN") {
      console.log("Admin access granted");
      return res.json(subject);
    }

    if (role === "TEACHER") {
      // Check if teacher is assigned to this subject
      const isAssigned = await prisma.subjectTeacher.findFirst({
        where: {
          subjectId: subjectId,
          teacher: { userId: userId },
        },
      });

      console.log(
        "Teacher assignment check:",
        isAssigned ? "assigned" : "not assigned"
      );

      if (!isAssigned) {
        return res.status(403).json({
          error: "Forbidden: You are not assigned to teach this subject",
        });
      }

      return res.json(subject);
    }

    if (role === "STUDENT") {
      // Check if student is in the same class as the subject
      const student = await prisma.student.findFirst({
        where: { userId: userId },
        select: { classId: true },
      });

      console.log(
        "Student class check:",
        student ? `student classId: ${student.classId}` : "student not found"
      );

      if (!student) {
        return res.status(403).json({ error: "Student record not found" });
      }

      if (student.classId !== subject.classId) {
        return res.status(403).json({
          error: "Forbidden: You can only access subjects from your class",
        });
      }

      return res.json(subject);
    }

    if (role === "PARENT") {
      // Check if any of the parent's children are in the same class as the subject
      const parent = await prisma.parent.findFirst({
        where: { userId: userId },
        select: { id: true },
      });

      console.log(
        "Parent check:",
        parent ? `parent id: ${parent.id}` : "parent not found"
      );

      if (!parent) {
        return res.status(403).json({ error: "Parent record not found" });
      }

      const parentStudentInClass = await prisma.parentStudent.findFirst({
        where: {
          parentId: parent.id,
          student: {
            classId: subject.classId,
          },
        },
      });

      console.log(
        "Parent student in class check:",
        parentStudentInClass ? "found" : "not found"
      );

      if (!parentStudentInClass) {
        return res.status(403).json({
          error:
            "Forbidden: You can only access subjects from your children's classes",
        });
      }

      return res.json(subject);
    }

    // For other roles, deny access
    console.log("Access denied for role:", role);
    return res.status(403).json({
      error: "Forbidden: You don't have access to this subject",
    });
  } catch (error: any) {
    console.error("Error in getSubjectById:", error);
    res.status(500).json({ error: error.message });
  }
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
  const userId = (req as any).userId;
  const role = (req as any).role;

  if (isNaN(classId)) {
    return res.status(400).json({ error: "Invalid class ID" });
  }

  try {
    let whereClause: any = { classId };

    // Add role-based filtering
    if (role === "TEACHER") {
      // Teachers can only see subjects they are assigned to teach in this class
      whereClause.teachers = {
        some: {
          teacher: {
            userId: userId,
          },
        },
      };
    } else if (role === "STUDENT") {
      // Students can only see subjects from their own class
      const student = await prisma.student.findFirst({
        where: { userId: userId },
        select: { classId: true },
      });

      if (!student) {
        return res.status(403).json({ error: "Student record not found" });
      }

      if (student.classId !== classId) {
        return res.status(403).json({
          error: "Forbidden: You can only access subjects from your class",
        });
      }
    } else if (role === "PARENT") {
      // Parents can only see subjects from classes where their children are enrolled
      const parent = await prisma.parent.findFirst({
        where: { userId: userId },
        select: { id: true },
      });

      if (!parent) {
        return res.status(403).json({ error: "Parent record not found" });
      }

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
          error:
            "Forbidden: You can only access subjects from your children's classes",
        });
      }
    }
    // Admin can see all subjects

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        class: true,
        teachers: {
          include: {
            teacher: { include: { user: true } },
          },
        },
      },
    });

    return res.status(200).json(subjects);
  } catch (error: any) {
    console.error("Error fetching subjects:", error);
    return res.status(500).json({ error: error.message });
  }
}
