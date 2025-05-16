import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import * as examController from "../controllers/examController";
import { Role } from "@prisma/client";

const router = Router();

router.get("/", authMiddleware, examController.getAllExams);
router.get("/:id", authMiddleware, examController.getExamById);
router.post("/", authMiddleware, examController.createExam);
router.patch("/:id", authMiddleware, examController.updateExam);
router.delete("/:id", authMiddleware, examController.deleteExam);
router.get(
  "/student/:studentId",
  authMiddleware,
  examController.getExamsByStudentId
);

export default router;
