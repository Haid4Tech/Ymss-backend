import { Router } from "express";
import * as gradeController from "../controllers/gradeController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// ===== ORIGINAL GRADE ROUTES =====
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

// ===== RESULTS ROUTES =====
// Get all results
router.get("/results/all", authMiddleware, gradeController.getAllResults);

// Get results by student
router.get("/results/student/:studentId", authMiddleware, gradeController.getResultsByStudent);

// Get results by class and subject
router.get("/results/class/:classId/subject/:subjectId", authMiddleware, gradeController.getResultsByClassAndSubject);

// Get results by class
router.get("/results/class/:classId", authMiddleware, gradeController.getResultsByClass);

// Get student report card
router.get("/results/report-card/:studentId", authMiddleware, gradeController.getStudentReportCard);

// Create or update result
router.post("/results", authMiddleware, gradeController.createOrUpdateResult);

// Bulk create/update results
router.post("/results/bulk", authMiddleware, gradeController.bulkCreateOrUpdateResults);

// Delete result
router.delete("/results/:id", authMiddleware, gradeController.deleteResult);

export default router;
