import { Router } from "express";
import * as parentController from "../controllers/parentController";
import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, parentController.getAllParents);
router.get("/:id", authMiddleware, parentController.getParentById);
router.post("/", adminMiddleware, parentController.createParent);
router.patch("/:id", authMiddleware, parentController.updateParent);
router.delete("/:id", authMiddleware, parentController.deleteParent);

export default router;
