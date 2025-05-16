import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../app";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const register = async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;
  if (
    role !== "STUDENT" &&
    role !== "TEACHER" &&
    role !== "PARENT" &&
    role !== "ADMIN"
  ) {
    return res.status(400).json({ error: "Invalid role" });
  }
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token: token,
    });
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email } = req.body;
  const pass = req.body.password;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const valid = await bcrypt.compare(pass, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1w",
  });

  const { password, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword, token });
};

export const me = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
};
