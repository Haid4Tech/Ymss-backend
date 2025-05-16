import { Request, Response } from "express";
import { prisma } from "../app";

export const getAllGrades = async (req: Request, res: Response) => {
  const grades = await prisma.grade.findMany({
    include: { student: true, exam: true },
  });
  res.json(grades);
};

export const getGradesByStudent = async (req: Request, res: Response) => {
  const grades = await prisma.grade.findMany({
    where: { studentId: Number(req.params.studentId) },
    include: { exam: true },
  });
  res.json(grades);
};

export const getGradesBySubject = async (req: Request, res: Response) => {
  const subjectId = Number(req.params.subjectId);
  const userId = (req as any).userId;
  const role = (req as any).role;

  // Get the subject, including its teacher
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { teacher: { select: { userId: true } } },
  });

  if (!subject) {
    return res.status(404).json({ error: "Subject not found" });
  }

  // Only allow if admin or the teacher for the subject
  const teacherUserId = subject.teacher?.userId;
  if (role !== "ADMIN" && userId !== teacherUserId) {
    return res.status(403).json({
      error:
        "Forbidden: Only the subject teacher or admin can view these grades",
    });
  }

  // Get all exams for this subject
  const exams = await prisma.exam.findMany({
    where: { subjectId },
    select: { id: true },
  });
  const examIds = exams.map((e) => e.id);

  if (examIds.length === 0) {
    return res.json([]); // No exams, no grades
  }

  // Get all grades for those exams
  const grades = await prisma.grade.findMany({
    where: { examId: { in: examIds } },
    include: { student: true, exam: true },
  });

  res.json(grades);
};

export const getGradesByExam = async (req: Request, res: Response) => {
  const examId = Number(req.params.examId);
  const userId = (req as any).userId;
  const role = (req as any).role;

  // Get the exam, including its subject and teacher
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: {
        select: { teacher: { select: { userId: true } } },
      },
    },
  });

  if (!exam) {
    return res.status(404).json({ error: "Exam not found" });
  }

  // Only allow if admin or the teacher for the subject
  const teacherUserId = exam.subject?.teacher?.userId;
  if (role !== "ADMIN" && userId !== teacherUserId) {
    return res.status(403).json({
      error:
        "Forbidden: Only the subject teacher or admin can view these grades",
    });
  }

  // Get all grades for this exam
  const grades = await prisma.grade.findMany({
    where: { examId },
    include: { student: true },
  });

  res.json(grades);
};

export const assignGrade = async (req: Request, res: Response) => {
  const { studentId, examId, value, date } = req.body;
  const grade = await prisma.grade.create({
    data: { studentId, examId, value, date: new Date(date) },
  });
  res.status(201).json(grade);
};

export const updateGrade = async (req: Request, res: Response) => {
  const gradeId = Number(req.params.id);
  const { value, date } = req.body;
  const userId = (req as any).userId;
  const role = (req as any).role;

  // Get the grade, including exam -> subject -> teacher
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    include: {
      exam: {
        include: {
          subject: {
            select: { teacher: { select: { userId: true } } },
          },
        },
      },
    },
  });

  if (!grade) {
    return res.status(404).json({ error: "Grade not found" });
  }

  // Only allow if admin or the teacher for the subject
  const teacherUserId = grade.exam.subject?.teacher?.userId;
  if (role !== "ADMIN" && userId !== teacherUserId) {
    return res
      .status(403)
      .json({
        error:
          "Forbidden: Only the subject teacher or admin can edit this grade",
      });
  }

  // Update the grade
  const updatedGrade = await prisma.grade.update({
    where: { id: gradeId },
    data: {
      value: value !== undefined ? value : grade.value,
      date: date ? new Date(date) : grade.date,
    },
  });

  res.json(updatedGrade);
};
