import { Router } from "express";
import * as gradeController from "../controllers/gradeController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, gradeController.getAllGrades);
router.get("/:studentId", authMiddleware, gradeController.getGradesByStudent);
router.get(
  "/subject/:subjectId",
  authMiddleware,
  gradeController.getGradesBySubject
);
router.get("/exam/:examId", authMiddleware, gradeController.getGradesByExam);
router.post("/", authMiddleware, gradeController.assignGrade);
router.patch("/:id", authMiddleware, gradeController.updateGrade);

export default router;
