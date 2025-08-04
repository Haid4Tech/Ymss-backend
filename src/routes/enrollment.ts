import { Router } from "express";
import * as enrollmentController from "../controllers/enrollmentController";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, enrollmentController.getAllEnrollments);
router.post("/", authMiddleware, enrollmentController.createEnrollment);
router.get(
  "/student/:studentId",
  authMiddleware,
  enrollmentController.getEnrollmentsByStudent
);
router.get(
  "/subject/:subjectId",
  authMiddleware,
  enrollmentController.getEnrollmentsBySubject
);
router.get(
  "/class/:classId",
  authMiddleware,
  enrollmentController.getEnrollmentByClass
);
router.delete("/:id", authMiddleware, enrollmentController.deleteEnrollment);

export default router;
