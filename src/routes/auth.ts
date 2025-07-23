import { Router } from "express";
import { login, me, register, updateProfile } from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, me);
router.put("/profile", authMiddleware, updateProfile);

export default router;
