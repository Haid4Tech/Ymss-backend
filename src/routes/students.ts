import { Router } from "express";
import * as studentController from "../controllers/studentController";
import * as StudentParentController from "../controllers/parentStudentController";
import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, studentController.getAllStudents);
router.get("/:id", authMiddleware, studentController.getStudentById);
router.post("/", adminMiddleware, studentController.createStudent);
router.patch("/:id", authMiddleware, studentController.updateStudent);
router.delete("/:id", authMiddleware, studentController.deleteStudent);

// Parent - Student
router.get(
  "/:studentId/parents",
  authMiddleware,
  StudentParentController.getParentsForStudent
);

export default router;
