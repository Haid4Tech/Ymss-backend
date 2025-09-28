import { Router } from "express";
import { getAllReligions, getReligionById } from "../controllers/religionController";

const router = Router();

// GET /api/religions - Get all religions
router.get("/", getAllReligions);

// GET /api/religions/:id - Get religion by ID
router.get("/:id", getReligionById);

export default router;
