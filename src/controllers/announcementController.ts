import { Request, Response } from "express";
import { prisma } from "../app";

export const getAllAnnouncements = async (req: Request, res: Response) => {
  const announcements = await prisma.announcement.findMany({
    include: { author: true },
  });
  res.json(announcements);
};

export const getAnnouncementById = async (req: Request, res: Response) => {
  const announcement = await prisma.announcement.findUnique({
    where: { id: Number(req.params.id) },
    include: { author: true },
  });
  if (!announcement)
    return res.status(404).json({ error: "Announcement not found" });
  res.json(announcement);
};

export const createAnnouncement = async (req: Request, res: Response) => {
  const { title, content, category, priority } = req.body;
  const authorId = (req as any).userId;
  const announcement = await prisma.announcement.create({
    data: { title, content, authorId, category },
  });
  res.status(201).json(announcement);
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  const { title, content } = req.body;
  const announcement = await prisma.announcement.update({
    where: { id: Number(req.params.id) },
    data: { title, content },
  });
  res.json(announcement);
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  await prisma.announcement.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
};
