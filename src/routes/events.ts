import { Router } from "express";
import * as eventController from "../controllers/eventController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, eventController.getAllEvents);
router.get("/:id", authMiddleware, eventController.getEventById);
router.post("/", authMiddleware, eventController.createEvent);
router.patch("/:id", authMiddleware, eventController.updateEvent);
router.delete("/:id", authMiddleware, eventController.deleteEvent);

export default router;
