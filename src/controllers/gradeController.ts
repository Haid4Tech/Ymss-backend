import { Request, Response } from "express";
import { prisma } from "../app";

// ===== HELPER FUNCTIONS =====

const checkTeacherAuthorization = async (
  subjectId: number,
  userId: number,
  role: string
) => {
  if (role === "ADMIN") return true;

  const subjectTeacher = await prisma.subjectTeacher.findFirst({
    where: {
      subjectId,
      teacher: { userId },
    },
  });

  return !!subjectTeacher;
};

const calculateGradeFields = (
  ca1?: number,
  ca2?: number,
  examScore?: number,
  ltc?: number
) => {
  // Use 0 for missing values instead of null to allow calculation
  const ca1Value = ca1 || 0;
  const ca2Value = ca2 || 0;
  const examValue = examScore || 0;
  const ltcValue = ltc || 0;

  const caTotal = ca1Value + ca2Value;
  const totalScore = caTotal + examValue;
  const overallScore = (totalScore + ltcValue) / 2;

  let grade = null;
  if (overallScore > 0) {
    if (overallScore >= 80) grade = "A";
    else if (overallScore >= 65) grade = "B";
    else if (overallScore >= 50) grade = "C";
    else if (overallScore >= 40) grade = "D";
    else grade = "F";
  }

  return {
    caTotal: caTotal > 0 ? caTotal : null,
    totalScore: totalScore > 0 ? totalScore : null,
    overallScore: overallScore > 0 ? overallScore : null,
    grade,
  };
};

const calculateClassStats = async (
  subjectId: number,
  classId: number,
  academicYear: string,
  term: string
) => {
  const classResults = await prisma.grade.findMany({
    where: {
      subjectId,
      classId,
      academicYear,
      // term,
      overallScore: { not: null },
    },
    select: { overallScore: true, id: true },
  });

  const validScores = classResults
    .map((r) => r.overallScore!)
    .filter((score) => score !== null);
  const classAverage =
    validScores.length > 0
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
      : null;

  // Calculate positions
  const sortedResults = classResults.sort(
    (a, b) => (b.overallScore || 0) - (a.overallScore || 0)
  );

  // Use a single transaction to update all positions at once
  if (sortedResults.length > 0) {
    await prisma.$transaction(
      sortedResults.map((result, index) =>
        prisma.grade.update({
          where: { id: result.id },
          data: {
            classAverage,
            subjectPosition: index + 1,
          },
        })
      )
    );
  }

  return { classAverage, validScores };
};

// ===== BASIC GRADE FUNCTIONS (Legacy) =====

export const getAllGrades = async (req: Request, res: Response) => {
  try {
    const grades = await prisma.grade.findMany({
      include: {
        student: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
        exam: true,
        subject: true,
        class: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(grades);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getGradesByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { academicYear, term } = req.query;

    const whereClause: any = { studentId: Number(studentId) };

    if (academicYear) whereClause.academicYear = academicYear;
    if (term) whereClause.term = term;

    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        exam: true,
        subject: true,
        class: true,
      },
      orderBy: { subject: { name: "asc" } },
    });
    res.json(grades);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getGradesBySubject = async (req: Request, res: Response) => {
  try {
    const subjectId = Number(req.params.subjectId);
    const userId = (req as any).userId;
    const role = (req as any).role;

    // Check authorization
    const isAuthorized = await checkTeacherAuthorization(
      subjectId,
      userId,
      role
    );
    if (!isAuthorized) {
      return res.status(403).json({
        error:
          "Forbidden: Only the subject teacher or admin can view these grades",
      });
    }

    const grades = await prisma.grade.findMany({
      where: {
        subjectId,
        academicYear: { not: undefined },
        term: { not: undefined },
      },
      include: {
        student: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
        subject: true,
        class: true,
      },
      orderBy: { overallScore: "desc" },
    });

    res.json(grades);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getGradesByExam = async (req: Request, res: Response) => {
  try {
    const examId = Number(req.params.examId);
    const userId = (req as any).userId;
    const role = (req as any).role;

    // Get the exam and check authorization
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subject: {
          select: {
            teachers: { select: { teacher: { select: { userId: true } } } },
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const isAuthorized = await checkTeacherAuthorization(
      exam.subjectId,
      userId,
      role
    );
    if (!isAuthorized) {
      return res.status(403).json({
        error:
          "Forbidden: Only the subject teacher or admin can view these grades",
      });
    }

    const grades = await prisma.grade.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
        subject: true,
        class: true,
      },
    });

    res.json(grades);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const assignGrade = async (req: Request, res: Response) => {
  try {
    const { studentId, examId, value, date } = req.body;
    const grade = await prisma.grade.create({
      data: {
        studentId,
        examId,
        value,
        date: new Date(date),
        // Set default values for comprehensive grading
        academicYear: "2024/2025",
        term: "FIRST",
        subjectId: 1, // This should be provided or derived from exam
        classId: 1, // This should be provided or derived from student
      },
      include: {
        student: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
        exam: true,
        subject: true,
        class: true,
      },
    });
    res.status(201).json(grade);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGrade = async (req: Request, res: Response) => {
  try {
    const gradeId = Number(req.params.id);
    const {
      value,
      date,
      ca1,
      ca2,
      examScore,
      ltc,
      overallScore,
      grade,
      subjectPosition,
      remark,
    } = req.body;
    const userId = (req as any).userId;
    const role = (req as any).role;

    // Get the grade and check authorization
    const existingGrade = await prisma.grade.findUnique({
      where: { id: gradeId },
      include: {
        subject: {
          select: {
            teachers: { select: { teacher: { select: { userId: true } } } },
          },
        },
      },
    });

    if (!existingGrade) {
      return res.status(404).json({ error: "Grade not found" });
    }

    const isAuthorized = await checkTeacherAuthorization(
      existingGrade.subjectId,
      userId,
      role
    );
    if (!isAuthorized) {
      return res.status(403).json({
        error:
          "Forbidden: Only the subject teacher or admin can edit this grade",
      });
    }

    // Calculate derived fields if comprehensive data is provided
    let calculatedFields = {};
    if (
      ca1 !== undefined ||
      ca2 !== undefined ||
      examScore !== undefined ||
      ltc !== undefined
    ) {
      const {
        caTotal,
        totalScore,
        overallScore: calcOverallScore,
        grade: calcGrade,
      } = calculateGradeFields(
        ca1 !== undefined ? ca1 : existingGrade.ca1,
        ca2 !== undefined ? ca2 : existingGrade.ca2,
        examScore !== undefined ? examScore : existingGrade.examScore,
        ltc !== undefined ? ltc : existingGrade.ltc
      );

      calculatedFields = {
        caTotal,
        totalScore,
        overallScore:
          overallScore !== undefined ? overallScore : calcOverallScore,
        grade: grade !== undefined ? grade : calcGrade,
      };
    }

    const updatedGrade = await prisma.grade.update({
      where: { id: gradeId },
      data: {
        // Legacy fields
        value: value !== undefined ? value : existingGrade.value,
        date: date ? new Date(date) : existingGrade.date,
        // Comprehensive fields
        ca1: ca1 !== undefined ? ca1 : existingGrade.ca1,
        ca2: ca2 !== undefined ? ca2 : existingGrade.ca2,
        examScore:
          examScore !== undefined ? examScore : existingGrade.examScore,
        ltc: ltc !== undefined ? ltc : existingGrade.ltc,
        overallScore:
          overallScore !== undefined
            ? overallScore
            : existingGrade.overallScore,
        grade: grade !== undefined ? grade : existingGrade.grade,
        subjectPosition:
          subjectPosition !== undefined
            ? subjectPosition
            : existingGrade.subjectPosition,
        remark: remark !== undefined ? remark : existingGrade.remark,
        // Calculated fields
        ...calculatedFields,
      },
      include: {
        student: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
        exam: true,
        subject: true,
        class: true,
      },
    });

    // Recalculate class statistics if this is a comprehensive result
    if (existingGrade.academicYear && existingGrade.term) {
      await calculateClassStats(
        existingGrade.subjectId,
        existingGrade.classId,
        existingGrade.academicYear,
        existingGrade.term
      );
    }

    res.json(updatedGrade);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ===== DEBUG FUNCTIONS =====

export const debugStudent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const role = (req as any).role;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
      },
    });

    if (role === "STUDENT") {
      // Check if student record exists
      const student = await prisma.student.findFirst({
        where: { userId },
        include: {
          class: { select: { name: true } },
        },
      });

      return res.json({
        user,
        student,
        message: "Debug info for student",
      });
    }

    return res.json({
      user,
      message: "Debug info for non-student",
    });
  } catch (error: any) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ===== COMPREHENSIVE RESULTS FUNCTIONS =====

export const getAllResults = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const role = (req as any).role;

    let whereClause: any = {
      academicYear: { not: undefined },
      term: { not: undefined },
    };

    // Add role-based filtering
    if (role === "STUDENT") {
      // Students can only see their own results
      const student = await prisma.student.findFirst({
        where: { userId },
        select: { id: true },
      });
      
      if (!student) {
        return res.status(403).json({
          error: "Forbidden: Student record not found",
        });
      }
      whereClause.studentId = student.id;
    } else if (role === "PARENT") {
      // Parents can only see their ward's results
      const studentIds = await prisma.student.findMany({
        where: {
          parents: {
            some: {
              parent: { userId },
            },
          },
        },
        select: { id: true },
      });

      if (studentIds.length === 0) {
        return res.status(403).json({
          error: "Forbidden: No ward found",
        });
      }

      whereClause.studentId = {
        in: studentIds.map((s) => s.id),
      };
    }
    // Admin and teachers can see all results

    const results = await prisma.grade.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
        subject: true,
        class: true,
      },
      orderBy: { createdAt: "desc" },
    });
    
    res.json(results);
  } catch (error: any) {
    console.error("Error in getAllResults:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getResultsByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { academicYear, term } = req.query;
    const userId = (req as any).userId;
    const role = (req as any).role;

    // Check if user can access this student's results
    if (role === "STUDENT") {
      // Students can only access their own results
      const student = await prisma.student.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (!student || student.id !== Number(studentId)) {
        return res.status(403).json({
          error: "Forbidden: You can only access your own results",
        });
      }
    } else if (role === "PARENT") {
      // Parents can only access their ward's results
      const student = await prisma.student.findFirst({
        where: {
          id: Number(studentId),
          parents: {
            some: {
              parent: { userId },
            },
          },
        },
        select: { id: true },
      });
      if (!student) {
        return res.status(403).json({
          error: "Forbidden: You can only access your ward's results",
        });
      }
    }
    // Admin and teachers can access any student's results

    const whereClause: any = {
      studentId: Number(studentId),
      academicYear: { not: null },
      term: { not: null },
    };

    if (academicYear) whereClause.academicYear = academicYear;
    if (term) whereClause.term = term;

    const results = await prisma.grade.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
        subject: true,
        class: true,
      },
      orderBy: { subject: { name: "asc" } },
    });

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getResultsByClassAndSubject = async (
  req: Request,
  res: Response
) => {
  try {
    const { classId, subjectId } = req.params;
    const { academicYear, term } = req.query;
    const userId = (req as any).userId;
    const role = (req as any).role;

    // Check authorization
    const isAuthorized = await checkTeacherAuthorization(
      Number(subjectId),
      userId,
      role
    );
    if (!isAuthorized) {
      return res.status(403).json({
        error: "Forbidden: You are not assigned to teach this subject",
      });
    }

    const whereClause: any = {
      classId: Number(classId),
      subjectId: Number(subjectId),
      academicYear: { not: null },
      term: { not: null },
    };

    if (academicYear) whereClause.academicYear = academicYear;
    if (term) whereClause.term = term;

    const results = await prisma.grade.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
        subject: true,
        class: true,
      },
      orderBy: { overallScore: "desc" },
    });

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getResultsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { academicYear, term } = req.query;
    const userId = (req as any).userId;
    const role = (req as any).role;

    let whereClause: any = {
      classId: Number(classId),
      academicYear: { not: null },
      term: { not: null },
    };

    // Add role-based filtering
    if (role === "STUDENT") {
      // Students can only see their own results
      const student = await prisma.student.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (!student) {
        return res.status(403).json({
          error: "Forbidden: Student record not found",
        });
      }
      whereClause.studentId = student.id;
    } else if (role === "PARENT") {
      // Parents can only see their ward's results
      const studentIds = await prisma.student.findMany({
        where: {
          classId: Number(classId),
          parents: {
            some: {
              parent: { userId },
            },
          },
        },
        select: { id: true },
      });

      if (studentIds.length === 0) {
        return res.status(403).json({
          error: "Forbidden: No ward found in this class",
        });
      }

      whereClause.studentId = {
        in: studentIds.map((s) => s.id),
      };
    }
    // Admin and teachers can see all results in the class

    if (academicYear) whereClause.academicYear = academicYear;
    if (term) whereClause.term = term;

    const results = await prisma.grade.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
        subject: true,
        class: true,
      },
      orderBy: [
        { student: { user: { firstname: "asc" } } },
        { subject: { name: "asc" } },
      ],
    });

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrUpdateResult = async (req: Request, res: Response) => {
  try {
    const {
      studentId,
      subjectId,
      classId,
      academicYear,
      term,
      ca1,
      ca2,
      examScore,
      ltc,
      remark,
    } = req.body;

    const userId = (req as any).userId;
    const role = (req as any).role;

    // Check authorization
    const isAuthorized = await checkTeacherAuthorization(
      Number(subjectId),
      userId,
      role
    );
    if (!isAuthorized) {
      return res.status(403).json({
        error: "Forbidden: You are not assigned to teach this subject",
      });
    }

    // Calculate derived fields
    const { caTotal, totalScore, overallScore, grade } = calculateGradeFields(
      ca1,
      ca2,
      examScore,
      ltc
    );

    const result = await prisma.grade.upsert({
      where: {
        studentId_subjectId_academicYear_term: {
          studentId: Number(studentId),
          subjectId: Number(subjectId),
          academicYear,
          term,
        },
      },
      update: {
        ca1: ca1 || null,
        ca2: ca2 || null,
        caTotal,
        examScore: examScore || null,
        totalScore,
        ltc: ltc || null,
        overallScore,
        grade,
        remark: remark || null,
      },
      create: {
        studentId: Number(studentId),
        subjectId: Number(subjectId),
        classId: Number(classId),
        academicYear,
        term,
        ca1: ca1 || null,
        ca2: ca2 || null,
        caTotal,
        examScore: examScore || null,
        totalScore,
        ltc: ltc || null,
        overallScore,
        grade,
        remark: remark || null,
      },
      include: {
        student: {
          include: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
        subject: true,
        class: true,
      },
    });

    // Recalculate class statistics
    await calculateClassStats(
      Number(subjectId),
      Number(classId),
      academicYear,
      term
    );

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkCreateOrUpdateResults = async (
  req: Request,
  res: Response
) => {
  try {
    const { classId, subjectId, academicYear, term, results } = req.body;
    const userId = (req as any).userId;
    const role = (req as any).role;

    // Check authorization
    const isAuthorized = await checkTeacherAuthorization(
      Number(subjectId),
      userId,
      role
    );
    if (!isAuthorized) {
      return res.status(403).json({
        error: "Forbidden: You are not assigned to teach this subject",
      });
    }

    const processedResults = [];

    for (const resultData of results) {
      const { studentId, ca1, ca2, examScore, ltc, remark } = resultData;

      // Calculate derived fields
      const { caTotal, totalScore, overallScore, grade } = calculateGradeFields(
        ca1,
        ca2,
        examScore,
        ltc
      );

      const result = await prisma.grade.upsert({
        where: {
          studentId_subjectId_academicYear_term: {
            studentId: Number(studentId),
            subjectId: Number(subjectId),
            academicYear,
            term,
          },
        },
        update: {
          ca1: ca1 || null,
          ca2: ca2 || null,
          caTotal,
          examScore: examScore || null,
          totalScore,
          ltc: ltc || null,
          overallScore,
          grade,
          remark: remark || null,
        },
        create: {
          studentId: Number(studentId),
          subjectId: Number(subjectId),
          classId: Number(classId),
          academicYear,
          term,
          ca1: ca1 || null,
          ca2: ca2 || null,
          caTotal,
          examScore: examScore || null,
          totalScore,
          ltc: ltc || null,
          overallScore,
          grade,
          remark: remark || null,
        },
      });

      processedResults.push(result);
    }

    // Recalculate class statistics
    const { classAverage } = await calculateClassStats(
      Number(subjectId),
      Number(classId),
      academicYear,
      term
    );

    res.status(201).json({
      message: "Results updated successfully",
      results: processedResults,
      classAverage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStudentReportCard = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { academicYear, term } = req.query;
    const userId = (req as any).userId;
    const role = (req as any).role;

    // Check if user can access this student's report card
    if (role === "STUDENT") {
      // Students can only access their own report card
      const student = await prisma.student.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (!student || student.id !== Number(studentId)) {
        return res.status(403).json({
          error: "Forbidden: You can only access your own report card",
        });
      }
    } else if (role === "PARENT") {
      // Parents can only access their ward's report card
      const student = await prisma.student.findFirst({
        where: {
          id: Number(studentId),
          parents: {
            some: {
              parent: { userId },
            },
          },
        },
        select: { id: true },
      });
      if (!student) {
        return res.status(403).json({
          error: "Forbidden: You can only access your ward's report card",
        });
      }
    }
    // Admin and teachers can access any student's report card

    const whereClause: any = {
      studentId: Number(studentId),
      academicYear: { not: null },
      term: { not: null },
    };

    if (academicYear) whereClause.academicYear = academicYear;
    if (term) whereClause.term = term;

    const results = await prisma.grade.findMany({
      where: whereClause,
      include: {
        subject: true,
        class: {
          include: {
            students: {
              include: {
                user: { select: { firstname: true, lastname: true } },
              },
            },
          },
        },
      },
      orderBy: { subject: { name: "asc" } },
    });

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "No results found for this student" });
    }

    // Calculate summary statistics
    const validScores = results
      .map((r) => r.overallScore)
      .filter((score) => score !== null) as number[];

    const totalMarksObtained = validScores.reduce(
      (sum, score) => sum + score,
      0
    );
    const totalMarksObtainable = results.length * 100; // Assuming 100 is max per subject
    const average =
      validScores.length > 0 ? totalMarksObtained / validScores.length : 0;

    const reportCard = {
      student: results[0].studentId,
      class: results[0].class,
      academicYear: results[0].academicYear,
      term: results[0].term,
      results,
      summary: {
        numberOfSubjects: results.length,
        marksObtainable: totalMarksObtainable,
        totalMarksObtained,
        average: Math.round(average * 100) / 100,
      },
    };

    res.json(reportCard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const role = (req as any).role;

    const result = await prisma.grade.findUnique({
      where: { id: Number(id) },
      include: {
        subject: {
          include: {
            teachers: {
              include: { teacher: { select: { userId: true } } },
            },
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }

    // Check authorization
    const isAuthorized = await checkTeacherAuthorization(
      result.subjectId,
      userId,
      role
    );
    if (!isAuthorized) {
      return res.status(403).json({
        error: "Forbidden: You are not assigned to teach this subject",
      });
    }

    await prisma.grade.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
