import { Router } from "express";
import * as classController from "../controllers/classController";
import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, classController.getAllClasses);
router.get("/:id", authMiddleware, classController.getClassById);
router.post("/", adminMiddleware, classController.createClass);
router.patch("/:id", authMiddleware, classController.updateClass);
router.delete("/:id", authMiddleware, classController.deleteClass);

export default router;
