import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../app";
import { exclude } from "../utils/helpers";

/**
 * Get All Students
 * @param req
 * @param res
 */
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
          firstname: true,
          lastname: true,
          role: true,
          // Do NOT include password
        },
      },
      class: true,
      enrollments: {
        include: {
          subject: true,
          attendance: true,
        },
      },
      parents: {
        include: {
          parent: {
            include: { user: true },
          },
        },
      },
    },
  });

  res.json({ students, page, limit, total });
};

/**
 * Get Student By ID
 * @param req
 * @param res
 * @returns
 */
export const getStudentById = async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          password: true,
          email: true,
          role: true,
          DOB: true,
          gender: true,
          street: true,
          state: true,
          city: true,
          zipcode: true,
          phone: true,
          photo: true,
          nationality: true,
          country: true,
          religion: true,
          bloodGroup: true,
          createdAt: true,
          medicalInfo: true,
          emergencyInfo: true,
        },
      },
      class: true,
      enrollments: {
        include: {
          subject: true,
          attendance: true,
        },
      },
      parents: {
        include: {
          parent: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!student) return res.status(404).json({ error: "Student not found" });

  // Exclude password from the user object
  const cleanUser = exclude(student.user, ["password"]);
  res.json({ ...student, user: cleanUser });
};

/**
 * Create Students
 * @param req
 * @param res
 * @returns
 */
export const createStudent = async (req: Request, res: Response) => {
  try {
    const {
      // User data
      firstname,
      lastname,
      email,
      password,
      DOB,
      gender,
      state,
      city,
      zipcode,
      street,
      phone,
      nationality,
      country,
      religion,
      bloodGroup,
      photo,
      parentsInfo,

      // Student-specific data
      classId,
      parentId,
      admissionDate,
      previousSchool,

      // Optional info
      medicalInfo,
      emergencyContact,
    } = req.body;

    // Basic required field validation
    if (
      !firstname ||
      !email ||
      !DOB ||
      !gender ||
      !street ||
      !city ||
      !state ||
      !classId ||
      !admissionDate
    ) {
      return res.status(400).json({
        error:
          "Name, email, DOB, gender, address, classId, and admissionDate are required",
      });
    }

    // Check for existing user by email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Validate class existence
    const existingClass = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
    });
    if (!existingClass) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Validate parent if parentId is provided
    if (parentId) {
      const existingParent = await prisma.parent.findUnique({
        where: { id: parseInt(parentId) },
      });
      if (!existingParent) {
        return res.status(404).json({ error: "Parent not found" });
      }
    }

    // Transaction: Create user, parent, student, and optional medical info
    const student = await prisma.$transaction(async (tx) => {
      // Generate hashed password
      const hashedPassword = password
        ? await bcrypt.hash(password, 10)
        : await bcrypt.hash(
            `${firstname.split(" ")[0].toLowerCase()}${new Date(
              DOB
            ).getFullYear()}`,
            10
          );

      // Create parent user and record if parent details provided
      const parentUser = await tx.user.create({
        data: {
          firstname: parentsInfo.parentName,
          email: parentsInfo.parentEmail,
          phone: parentsInfo.parentPhone,
          password: hashedPassword,
          role: "PARENT",
          nationality,
          country,
          religion,
        },
      });

      const parentRecord = await tx.parent.create({
        data: { userId: parentUser.id },
      });

      // Create student user
      const studentUser = await tx.user.create({
        data: {
          firstname,
          lastname,
          email,
          password: hashedPassword,
          role: "STUDENT",
          DOB: new Date(DOB),
          gender: gender.toUpperCase(),
          street,
          city,
          zipcode,
          state,
          phone,
          nationality,
          country,
          religion,
          bloodGroup,
          photo,
        },
      });

      // Create student record
      const studentRecord = await tx.student.create({
        data: {
          userId: studentUser.id,
          classId: parseInt(classId),
          admissionDate: new Date(admissionDate),
          previousSchool,
          relationship: parentsInfo.relationship,
        },
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
              role: true,
              DOB: true,
              gender: true,
              street: true,
              city: true,
              zipcode: true,
              state: true,
              phone: true,
              photo: true,
              nationality: true,
              country: true,
              religion: true,
              bloodGroup: true,
              createdAt: true,
              medicalInfo: true,
              emergencyInfo: true,
            },
          },
          class: true,
          parents: true,
        },
      });

      // create parent - student relationship
      await tx.parentStudent.create({
        data: {
          parentId: parentRecord.id,
          studentId: studentRecord.id,
        },
        include: {
          parent: true,
          student: true,
        },
      });

      // Optional medical info
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
            userId: studentUser.id,
            conditions: medicalInfo.conditions,
            allergies: medicalInfo.allergies,
            medications: medicalInfo.medications,
            doctorName: medicalInfo.doctorName,
            doctorPhone: medicalInfo.doctorPhone,
          },
        });
      }

      return studentRecord;
    });

    res.status(201).json({
      message: "Student created successfully",
      student,
    });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({ error: "Failed to create student" });
  }
};

/**
 * Update Student Record
 * @param req
 * @param res
 * @returns
 */
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const {
      classId,
      parentId,
      admissionDate,
      previousSchool,
      firstname,
      lastname,
      email,
      password,
      DOB,
      gender,
      state,
      city,
      zipcode,
      street,
      phone,
      nationality,
      country,
      religion,
      bloodGroup,
      photo,
      parentsInfo, // unused?
    } = req.body;

    const studentId = parseInt(req.params.id);

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

    // Build dynamic user update
    const userUpdateFields = {
      firstname,
      lastname,
      email,
      password,
      DOB: DOB ? new Date(DOB) : undefined,
      gender,
      street,
      city,
      state,
      zipcode,
      phone,
      nationality,
      country,
      religion,
      bloodGroup,
      photo,
    };

    const userUpdateData: Record<string, any> = {};
    Object.entries(userUpdateFields).forEach(([key, value]) => {
      if (value !== undefined) {
        userUpdateData[key as keyof typeof userUpdateFields] = value;
      }
    });

    // Update user
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: existingStudent.userId },
        data: userUpdateData,
      });
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            role: true,
            DOB: true,
            gender: true,
            street: true,
            city: true,
            state: true,
            zipcode: true,
            photo: true,
            nationality: true,
            country: true,
            religion: true,
            bloodGroup: true,
            createdAt: true,
            medicalInfo: true,
          },
        },
        class: true,
        parents: true,
      },
    });

    res.json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
};

/**
 * Delete Student Record
 * @param req
 * @param res
 */
export const deleteStudent = async (req: Request, res: Response) => {
  await prisma.student.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
};
