import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../app";

// Get all users (Admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        medicalInfo: true,
        EmergencyContacts: true,
      },
    });
    
    // Exclude passwords from all users
    const usersWithoutPasswords = users.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get single user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const userRole = (req as any).role;

    // Users can only view their own profile unless they're admin
    if (userRole !== "ADMIN" && parseInt(id) !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: Can only view your own profile" });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        medicalInfo: true,
        EmergencyContacts: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Exclude password from response
    const { password: __, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Update user (Admin only)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      email, 
      role, 
      password, 
      DOB, 
      gender, 
      address, 
      photo, 
      nationality, 
      country, 
      religion, 
      bloodGroup 
    } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: parseInt(id) },
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
    if (role) updateData.role = role; // Admin can update any role
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (DOB) updateData.DOB = new Date(DOB);
    if (gender) updateData.gender = gender;
    if (address) updateData.address = address;
    if (photo !== undefined) updateData.photo = photo;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (country !== undefined) updateData.country = country;
    if (religion !== undefined) updateData.religion = religion;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        medicalInfo: true,
        EmergencyContacts: true,
      },
    });

    // Exclude password from response
    const { password: ___, ...userWithoutPassword } = updatedUser;

    res.json({ message: "User updated successfully", user: userWithoutPassword });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Delete user (Admin only, or users can delete their own account)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const userRole = (req as any).role;

    // Users can only delete their own account unless they're admin
    if (userRole !== "ADMIN" && parseInt(id) !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: Can only delete your own account" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete user (this will cascade delete related records)
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Create user (Admin only - alternative to registration)
export const createUser = async (req: Request, res: Response) => {
  try {
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
      bloodGroup 
    } = req.body;

    if (!email || !password || !name || !role || !DOB || !gender || !address) {
      return res.status(400).json({ error: "Email, password, name, role, DOB, gender, and address are required fields" });
    }

    if (
      role !== "STUDENT" &&
      role !== "TEACHER" &&
      role !== "PARENT" &&
      role !== "ADMIN"
    ) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
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
      include: {
        medicalInfo: true,
        EmergencyContacts: true,
      },
    });

    // Exclude password from response
    const { password: ____, ...userWithoutPassword } = user;

    res.status(201).json({ message: "User created successfully", user: userWithoutPassword });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};
