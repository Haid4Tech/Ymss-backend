import { Request, Response } from "express";
import { prisma } from "../app";

export const getAllRecords = async (req: Request, res: Response) => {
  // Parse pagination params, with defaults
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const take = limit;

  // Get total count for pagination info
  const total = await prisma.academicRecord.count();

  const records = await prisma.academicRecord.findMany({
    skip,
    take,
    include: { student: true },
  });

  res.json({
    records,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

export const getRecordsByStudent = async (req: Request, res: Response) => {
  const records = await prisma.academicRecord.findMany({
    where: { studentId: Number(req.params.studentId) },
  });
  res.json(records);
};

export const createRecord = async (req: Request, res: Response) => {
  const { studentId, year, term, summary } = req.body;
  const record = await prisma.academicRecord.create({
    data: { studentId, year, term, summary },
  });
  res.status(201).json(record);
};
