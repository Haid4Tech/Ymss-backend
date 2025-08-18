import { Request, Response } from "express";
import { prisma } from "../app";
import { getRoleBasedWhere } from "../utils/roleDataFilter";
import { checkStudentAccess } from "../utils/helpers";

export const getAllExams = async (req: Request, res: Response) => {
  const exams = await prisma.exam.findMany({
    include: { class: true, subject: true },
  });
  res.json(exams);
};

export const getExamById = async (req: Request, res: Response) => {
  const exam = await prisma.exam.findUnique({
    where: { id: Number(req.params.id) },
    include: { class: true, subject: true },
  });
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  res.json(exam);
};

export const createExam = async (req: Request, res: Response) => {
  const {
    title,
    date,
    classId,
    subjectId,
    teacherId,
    startTime,
    examType,
    duration,
  } = req.body;
  const exam = await prisma.exam.create({
    data: {
      title,
      date: new Date(date),
      classId,
      subjectId,
      teacherId,
      startTime,
      examType,
      duration: duration ? duration : 0,
    },
  });
  res.status(201).json(exam);
};

export const updateExam = async (req: Request, res: Response) => {
  const { title, date, classId, subjectId, teacherId, startTime, examType } =
    req.body;

  const updateData: any = {};
  if (title) updateData.title = title;
  if (date !== undefined || date !== null) updateData.date = new Date(date);
  if (classId) updateData.classId = classId;
  if (subjectId) updateData.subjectId = subjectId;
  if (teacherId) updateData.teacherId = teacherId;
  if (startTime) updateData.startTime = startTime;
  if (examType) updateData.examType = examType;

  const exam = await prisma.exam.update({
    where: { id: Number(req.params.id) },
    data: updateData,
  });
  res.json(exam);
};

export const deleteExam = async (req: Request, res: Response) => {
  await prisma.exam.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
};

export const getExamsByStudentId = async (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId);

  if (isNaN(studentId)) {
    return res.status(400).json({ error: "Invalid student ID" });
  }

  const role = (req as any).role;

  // Find the student's class
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true },
  });

  if (!student || !student.classId) {
    return res.status(404).json({ error: "Student not found" });
  }

  // Check if the user has permission to view exams for this student
  const checkAccess = await checkStudentAccess(
    role,
    (req as any).userId,
    student.userId
  );

  if (!checkAccess) {
    return res.status(403).json({
      error:
        "Forbidden. You do not have access to another student's records. This incident has been reported!",
    });
  }

  // Get all exams for the student's class
  const where = (await getRoleBasedWhere(
    student.userId,
    role,
    "exam",
    student
  )) as any;

  const exams = await prisma.exam.findMany({
    where,
    include: { class: true, subject: true },
  });
  res.json(exams);
};
