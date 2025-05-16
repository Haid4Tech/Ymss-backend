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
    if (!student.classId) return { id: -1 }; // No data

    if (model === "exam") {
      return { classId: student.classId };
    }

    if (model === "grade" || model === "record") {
      return { studentId: student.id };
    }
  }

  if (role === "PARENT") {
    // Get all students for this parent
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: { students: true },
    });
    const studentIds = parent?.students.map((s) => s.id) || [-1];

    if (model === "exam") {
      // Get all classIds for parent's students
      const classIds = parent?.students
        .map((s) => s.classId)
        .filter(Boolean) || [-1];
      // Get all subjects for those classes
      const subjects = await prisma.subject.findMany({
        where: { classId: { in: classIds } },
        select: { id: true },
      });
      const subjectIds = subjects.map((s) => s.id);
      return { subjectId: { in: subjectIds } };
    }

    if (model === "grade" || model === "record") {
      return { studentId: { in: studentIds } };
    }
  }

  if (role === "TEACHER") {
    // Get all subjects taught by this teacher
    const subjects = await prisma.subject.findMany({
      where: { teacher: { userId } },
      select: { id: true },
    });
    const subjectIds = subjects.map((s) => s.id);

    if (model === "exam") {
      return { subjectId: { in: subjectIds } };
    }

    if (model === "grade" || model === "record") {
      // Get all exams for these subjects
      const exams = await prisma.exam.findMany({
        where: { subjectId: { in: subjectIds } },
        select: { id: true },
      });
      const examIds = exams.map((e) => e.id);

      if (model === "grade") {
        return { examId: { in: examIds } };
      }
      // For records, get all students in the classes of these subjects
      let classIds =
        (await prisma.subject
          .findMany({
            where: { id: { in: subjectIds } },
            select: { classId: true },
          })
          .then((subjects) =>
            subjects.map((s) => s.classId).filter(Boolean)
          )) ?? [];
      classIds ??= [];
      /*   const students = await prisma.student.findMany({
        where: { classId: { in: classIds } },
        select: { id: true },
      });
      const studentIds = students.map((s) => s.id);
      return { studentId: { in: studentIds } }; */
    }
  }

  return { id: -1 }; // Default: no data
};
