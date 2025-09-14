import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;

    const userId = payload.userId;
    const role = payload.role;

    (req as any).userId = userId;
    (req as any).role = role;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }
    (req as any).userId = payload.userId;
    (req as any).role = payload.role;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const teacherOrAdminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.role !== "ADMIN" && payload.role !== "TEACHER") {
      return res.status(403).json({ error: "Forbidden: Teachers or Admins only" });
    }
    (req as any).userId = payload.userId;
    (req as any).role = payload.role;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};