import { prisma } from "../app";

export const getRoleBasedWhere = async (
  userId: number,
  role: string,
  model: "exam" | "grade" | "record",
  student?: any
) => {
  if (role === "ADMIN") {
    return {}; // No filter
  }

  if (role === "STUDENT") {
    if (!student?.classId) return { id: -1 }; // No data

    if (model === "exam") {
      return { classId: student.classId };
    }

    if (model === "grade") {
      return {
        enrollment: {
          studentId: student.id,
        },
      };
    }

    if (model === "record") {
      return {
        enrollment: {
          studentId: student.id,
        },
      };
    }
  }

  if (role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: { students: true },
    });

    const studentIds = parent?.students.map((s) => s.id) || [-1];

    // if (model === "exam") {
    //   const classIds = parent?.students
    //     .map((s) => s.classId)
    //     .filter(Boolean) || [-1];

    //   return {
    //     classId: { in: classIds },
    //   };
    // }

    if (model === "grade" || model === "record") {
      return {
        enrollment: {
          studentId: { in: studentIds },
        },
      };
    }
  }

  if (role === "TEACHER") {
    // Get subjects taught by this teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: {
        subjects: true,
      },
    });

    const subjectIds = teacher?.subjects.map((s) => s.id) || [-1];

    if (model === "exam") {
      return {
        subjectId: { in: subjectIds },
      };
    }

    if (model === "grade" || model === "record") {
      return {
        enrollment: {
          subjectId: { in: subjectIds },
        },
      };
    }
  }

  return { id: -1 }; // Default: no data
};
