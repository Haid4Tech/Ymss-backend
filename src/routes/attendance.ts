import { Router } from "express";
import * as attendanceController from "../controllers/attendanceController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Attendance routes
router.get("/", authMiddleware, attendanceController.getAllAttendance);
router.get("/:id", authMiddleware, attendanceController.getAttendanceById);
router.get(
  "/class/:classId",
  authMiddleware,
  attendanceController.getAttendanceByClass
);
router.get(
  "/class/:classId/date/:date",
  authMiddleware,
  attendanceController.getAttendanceByClassAndDate
);
router.get(
  "/student/:studentId",
  authMiddleware,
  attendanceController.getAttendanceByStudent
);
router.get(
  "/class/:classId/stats",
  authMiddleware,
  attendanceController.getAttendanceStats
);
router.get(
  "/teacher/classes",
  authMiddleware,
  attendanceController.getTeacherClasses
);

// Create attendance
router.post("/", authMiddleware, attendanceController.createAttendance);
router.post("/bulk", authMiddleware, attendanceController.createBulkAttendance);

// Update attendance
router.put("/:id", authMiddleware, attendanceController.updateAttendanceById);

// Delete attendance
router.delete("/:id", authMiddleware, attendanceController.deleteAttendance);

export default router;
