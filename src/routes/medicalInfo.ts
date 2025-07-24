import { Router } from "express";
import {
  getMedicalInfo,
  createMedicalInfo,
  updateMedicalInfo,
  deleteMedicalInfo,
} from "../controllers/medicalInfoController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Get medical info for a user
router.get("/:userId", authMiddleware, getMedicalInfo);

// Create medical info for a user
router.post("/:userId", authMiddleware, createMedicalInfo);

// Update medical info for a user
router.put("/:userId", authMiddleware, updateMedicalInfo);

// Delete medical info for a user
router.delete("/:userId", authMiddleware, deleteMedicalInfo);

export default router; 