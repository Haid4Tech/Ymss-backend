import { Router } from "express";
import * as subjectController from "../controllers/subjectController";
import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, subjectController.getAllSubjects);
router.get("/:id", authMiddleware, subjectController.getSubjectById);
router.get(
  "/class/:classId",
  authMiddleware,
  subjectController.getSubjectByClassId
);
router.post("/", adminMiddleware, subjectController.createSubject);
router.patch("/:id", authMiddleware, subjectController.updateSubject);
router.delete("/:id", authMiddleware, subjectController.deleteSubject);
router.patch(
  "/:subjectId/assign-teacher",
  adminMiddleware,
  subjectController.assignTeacherToSubject
);

export default router;
