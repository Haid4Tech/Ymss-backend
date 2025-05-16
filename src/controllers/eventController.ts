import { Request, Response } from "express";
import { prisma } from "../app";

export const getAllEvents = async (req: Request, res: Response) => {
  const events = await prisma.event.findMany();
  res.json(events);
};

export const getEventById = async (req: Request, res: Response) => {
  const event = await prisma.event.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(event);
};

export const createEvent = async (req: Request, res: Response) => {
  const { title, description, date } = req.body;
  const createdById = (req as any).userId;
  const event = await prisma.event.create({
    data: { title, description, date: new Date(date), createdById },
  });
  res.status(201).json(event);
};

export const updateEvent = async (req: Request, res: Response) => {
  const { title, description, date } = req.body;
  const event = await prisma.event.update({
    where: { id: Number(req.params.id) },
    data: { title, description, date: new Date(date) },
  });
  res.json(event);
};

export const deleteEvent = async (req: Request, res: Response) => {
  await prisma.event.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
};
