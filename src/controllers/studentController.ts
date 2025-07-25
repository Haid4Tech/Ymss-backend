import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../app";
import { exclude } from "../utils/helpers";

export const getAllStudents = async (req: Request, res: Response) => {
  // Parse pagination params, with defaults
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const take = limit;

  // Get total count for pagination info
  const total = await prisma.student.count();

  const students = await prisma.student.findMany({
    skip,
    take,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          // Do NOT include password
        },
      },
      class: true,
      parent: true,
    },
  });

  res.json({ students, page, limit, total });
};

export const getStudentById = async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: Number(req.params.id) },
    include: { user: true, class: true, parent: true },
  });

  if (!student) return res.status(404).json({ error: "Student not found" });

  // Exclude password from the user object
  const cleanUser = exclude(student.user, ["password"]);
  res.json({ ...student, user: cleanUser });
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const {
      // User data
      name,
      email,
      password,
      DOB,
      gender,
      address,
      phone,
      nationality,
      country,
      religion,
      bloodGroup,
      photo,

      // Student specific data
      classId,
      parentId,
      admissionDate,
      previousSchool,

      // Medical information
      medicalInfo,

      // Emergency contact
      emergencyContact,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !DOB ||
      !gender ||
      !address ||
      !classId ||
      !admissionDate
    ) {
      return res.status(400).json({
        error:
          "Name, email, DOB, gender, address, classId, and admissionDate are required",
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Verify that the class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
    });

    if (!existingClass) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Verify parent exists if parentId is provided
    if (parentId) {
      const existingParent = await prisma.parent.findUnique({
        where: { id: parseInt(parentId) },
      });

      if (!existingParent) {
        return res.status(404).json({ error: "Parent not found" });
      }
    }

    // Create user and student in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user first
      const hashedPassword = password
        ? await bcrypt.hash(password, 10)
        : await bcrypt.hash(
            `${name.split(" ")[0].toLowerCase()}${new Date(DOB).getFullYear()}`,
            10
          );

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "STUDENT",
          DOB: new Date(DOB),
          gender: gender.toUpperCase(),
          address,
          nationality,
          country,
          religion,
          bloodGroup,
          photo,
        },
      });

      // Create medical info if provided
      if (
        medicalInfo &&
        (medicalInfo.conditions ||
          medicalInfo.allergies ||
          medicalInfo.medications ||
          medicalInfo.doctorName ||
          medicalInfo.doctorPhone)
      ) {
        await tx.medicalInfo.create({
          data: {
            userId: user.id,
            conditions: medicalInfo.conditions,
            allergies: medicalInfo.allergies,
            medications: medicalInfo.medications,
            doctorName: medicalInfo.doctorName,
            doctorPhone: medicalInfo.doctorPhone,
          },
        });
      }

      // Create emergency contact if provided
      if (
        emergencyContact &&
        emergencyContact.name &&
        emergencyContact.phone &&
        emergencyContact.relation
      ) {
        await tx.emergencyContacts.create({
          data: {
            userId: user.id,
            name: emergencyContact.name,
            phone: emergencyContact.phone,
            relation: emergencyContact.relation,
          },
        });
      }

      // Create the student record
      const student = await tx.student.create({
        data: {
          userId: user.id,
          classId: parseInt(classId),
          parentId: parentId ? parseInt(parentId) : null,
          admissionDate: new Date(admissionDate),
          previousSchool,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              DOB: true,
              gender: true,
              address: true,
              photo: true,
              nationality: true,
              country: true,
              religion: true,
              bloodGroup: true,
              createdAt: true,
            },
            include: {
              medicalInfo: true,
              emergencyInfo: true,
            },
          },
          class: true,
          parent: true,
        },
      });

      return student;
    });

    res
      .status(201)
      .json({ message: "Student created successfully", student: result });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({ error: "Failed to create student" });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { classId, parentId, admissionDate, previousSchool } = req.body;
    const studentId = parseInt(req.params.id);

    // Verify student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existingStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    const updateData: any = {};

    // Validate and set classId
    if (classId) {
      const existingClass = await prisma.class.findUnique({
        where: { id: parseInt(classId) },
      });
      if (!existingClass) {
        return res.status(404).json({ error: "Class not found" });
      }
      updateData.classId = parseInt(classId);
    }

    // Validate and set parentId
    if (parentId) {
      const existingParent = await prisma.parent.findUnique({
        where: { id: parseInt(parentId) },
      });
      if (!existingParent) {
        return res.status(404).json({ error: "Parent not found" });
      }
      updateData.parentId = parseInt(parentId);
    } else if (parentId === null) {
      updateData.parentId = null;
    }

    if (admissionDate) updateData.admissionDate = new Date(admissionDate);
    if (previousSchool !== undefined)
      updateData.previousSchool = previousSchool;

    const student = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            DOB: true,
            gender: true,
            address: true,
            photo: true,
            nationality: true,
            country: true,
            religion: true,
            bloodGroup: true,
            createdAt: true,
          },
        },
        class: true,
        parent: true,
      },
    });

    res.json({ message: "Student updated successfully", student });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  await prisma.student.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
};
