import { Router } from "express";
import * as announcementController from "../controllers/announcementController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, announcementController.getAllAnnouncements);
router.get("/:id", authMiddleware, announcementController.getAnnouncementById);
router.post("/", authMiddleware, announcementController.createAnnouncement);
router.patch("/:id", authMiddleware, announcementController.updateAnnouncement);
router.delete(
  "/:id",
  authMiddleware,
  announcementController.deleteAnnouncement
);

export default router;
