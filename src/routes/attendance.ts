import { Router } from "express";
import * as subjectAttendanceController from "../controllers/subjectAttendanceController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Get all attendance records
router.get("/", authMiddleware, subjectAttendanceController.getAllSubjectAttendance);

// Class-based attendance routes
router.get("/class/:classId/date/:date", authMiddleware, subjectAttendanceController.getAttendanceByClassAndDate);
router.get("/class/:classId/summary", authMiddleware, subjectAttendanceController.getClassAttendanceSummary);
router.post("/class", authMiddleware, subjectAttendanceController.takeClassAttendance);

// Subject attendance specific routes
router.get(
  "/subject/enrollment/:enrollmentId",
  authMiddleware,
  subjectAttendanceController.getAttendanceByEnrollment
);
router.get(
  "/subject/:subjectId",
  authMiddleware,
  subjectAttendanceController.getAttendanceBySubject
);
router.get(
  "/student/:studentId",
  authMiddleware,
  subjectAttendanceController.getAttendanceByStudent
);
router.post(
  "/subject",
  authMiddleware,
  subjectAttendanceController.markSubjectAttendance
);

export default router;
