import { Request, Response } from "express";
import { prisma } from "../app";

// Get medical info for a user
export const getMedicalInfo = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requesterId = (req as any).userId;
    const requesterRole = (req as any).role;

    // Users can only view their own medical info unless they're admin
    if (requesterRole !== "ADMIN" && parseInt(userId) !== requesterId) {
      return res.status(403).json({ error: "Forbidden: Can only view your own medical information" });
    }

    const medicalInfo = await prisma.medicalInfo.findUnique({
      where: { userId: parseInt(userId) },
      include: { user: { select: { name: true, email: true } } }
    });

    if (!medicalInfo) {
      return res.status(404).json({ error: "Medical information not found" });
    }

    res.json(medicalInfo);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch medical information" });
  }
};

// Create medical info for a user
export const createMedicalInfo = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requesterId = (req as any).userId;
    const requesterRole = (req as any).role;
    const { conditions, allergies, medications, doctorName, doctorPhone } = req.body;

    // Users can only create their own medical info unless they're admin
    if (requesterRole !== "ADMIN" && parseInt(userId) !== requesterId) {
      return res.status(403).json({ error: "Forbidden: Can only create your own medical information" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if medical info already exists
    const existingMedicalInfo = await prisma.medicalInfo.findUnique({
      where: { userId: parseInt(userId) }
    });

    if (existingMedicalInfo) {
      return res.status(400).json({ error: "Medical information already exists for this user" });
    }

    const medicalInfo = await prisma.medicalInfo.create({
      data: {
        userId: parseInt(userId),
        conditions,
        allergies,
        medications,
        doctorName,
        doctorPhone,
      },
    });

    res.status(201).json({ message: "Medical information created successfully", medicalInfo });
  } catch (error) {
    console.error("Create medical info error:", error);
    res.status(500).json({ error: "Failed to create medical information" });
  }
};

// Update medical info
export const updateMedicalInfo = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requesterId = (req as any).userId;
    const requesterRole = (req as any).role;
    const { conditions, allergies, medications, doctorName, doctorPhone } = req.body;

    // Users can only update their own medical info unless they're admin
    if (requesterRole !== "ADMIN" && parseInt(userId) !== requesterId) {
      return res.status(403).json({ error: "Forbidden: Can only update your own medical information" });
    }

    const updateData: any = {};
    if (conditions !== undefined) updateData.conditions = conditions;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (medications !== undefined) updateData.medications = medications;
    if (doctorName !== undefined) updateData.doctorName = doctorName;
    if (doctorPhone !== undefined) updateData.doctorPhone = doctorPhone;

    const updatedMedicalInfo = await prisma.medicalInfo.update({
      where: { userId: parseInt(userId) },
      data: updateData,
    });

    res.json({ message: "Medical information updated successfully", medicalInfo: updatedMedicalInfo });
  } catch (error) {
    console.error("Update medical info error:", error);
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: "Medical information not found" });
    }
    res.status(500).json({ error: "Failed to update medical information" });
  }
};

// Delete medical info
export const deleteMedicalInfo = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requesterId = (req as any).userId;
    const requesterRole = (req as any).role;

    // Users can only delete their own medical info unless they're admin
    if (requesterRole !== "ADMIN" && parseInt(userId) !== requesterId) {
      return res.status(403).json({ error: "Forbidden: Can only delete your own medical information" });
    }

    await prisma.medicalInfo.delete({
      where: { userId: parseInt(userId) },
    });

    res.json({ message: "Medical information deleted successfully" });
  } catch (error) {
    console.error("Delete medical info error:", error);
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: "Medical information not found" });
    }
    res.status(500).json({ error: "Failed to delete medical information" });
  }
};