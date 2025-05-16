import { Router } from "express";
import * as teacherController from "../controllers/teacherController";
import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, teacherController.getAllTeachers);
router.get("/:id", authMiddleware, teacherController.getTeacherById);
router.post("/", adminMiddleware, teacherController.createTeacher);
router.patch("/:id", authMiddleware, teacherController.updateTeacher);
router.delete("/:id", authMiddleware, teacherController.deleteTeacher);

export default router;
