import { Router } from "express";
import * as attendanceController from "../controllers/attendanceController";
import * as subjectAttendanceController from "../controllers/subjectAttendanceController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// General attendance routes
router.get("/", authMiddleware, attendanceController.getAllSubjectAttendance);
router.get(
  "/:studentId",
  authMiddleware,
  attendanceController.getSubjectAttendanceByStudent
);
router.post("/", authMiddleware, attendanceController.markSubjectAttendance);

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
