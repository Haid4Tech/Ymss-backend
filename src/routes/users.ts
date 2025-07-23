import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
} from "../controllers/userController";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", adminMiddleware, getAllUsers);
router.post("/", adminMiddleware, createUser);
router.get("/:id", authMiddleware, getUserById);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, deleteUser);

export default router;
