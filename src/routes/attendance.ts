import { Router } from "express";
import * as attendanceController from "../controllers/attendanceController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Class-based attendance routes
router.get("/", authMiddleware, attendanceController.getAllAttendance);
router.get(
  "/teacher/classes",
  authMiddleware,
  attendanceController.getTeacherClasses
);
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
router.post("/", authMiddleware, attendanceController.createAttendance);
router.post("/bulk", authMiddleware, attendanceController.createBulkAttendance);
router.put("/:id", authMiddleware, attendanceController.updateAttendanceById);
router.put(
  "/class/:classId/date/:date",
  authMiddleware,
  attendanceController.updateAttendanceByClassAndDate
);
router.delete("/:id", authMiddleware, attendanceController.deleteAttendance);

export default router;
