import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../app";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const register = async (req: Request, res: Response) => {
  const {
    email,
    password,
    name,
    role,
    DOB,
    gender,
    address,
    photo,
    nationality,
    country,
    religion,
    bloodGroup,
  } = req.body;

  if (
    role !== "STUDENT" &&
    role !== "TEACHER" &&
    role !== "PARENT" &&
    role !== "ADMIN"
  ) {
    return res.status(400).json({ error: "Invalid role" });
  }

  if (!DOB || !gender || !address) {
    return res
      .status(400)
      .json({ error: "DOB, gender, and address are required fields" });
  }

  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role,
        DOB: new Date(DOB),
        gender,
        address,
        photo,
        nationality,
        country,
        religion,
        bloodGroup,
      },
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
        DOB: user.DOB,
        gender: user.gender,
        address: user.address,
        photo: user.photo,
        nationality: user.nationality,
        country: user.country,
        religion: user.religion,
        bloodGroup: user.bloodGroup,
        createdAt: user.createdAt,
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

  let teacherRecord = null;

  if (user.role === "TEACHER") {
    teacherRecord = await prisma.teacher.findUnique({
      where: { userId: user.id },
    });
  }

  const { password, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    teacher: teacherRecord,
    token,
  });
};

export const me = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      medicalInfo: true,
      emergencyContacts: true,
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      name,
      email,
      DOB,
      gender,
      address,
      photo,
      nationality,
      country,
      religion,
      bloodGroup,
    } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (DOB) updateData.DOB = new Date(DOB);
    if (gender) updateData.gender = gender;
    if (address) updateData.address = address;
    if (photo !== undefined) updateData.photo = photo;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (country !== undefined) updateData.country = country;
    if (religion !== undefined) updateData.religion = religion;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        medicalInfo: true,
        emergencyContacts: true,
      },
    });

    // Exclude password from response
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      message: "Profile updated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
