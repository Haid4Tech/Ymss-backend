import { Request, Response } from "express";
import { prisma } from "../app";

// Get All Attendance data
export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await prisma.attendance.findMany({
      include: { class: true },
      orderBy: { date: "desc" },
    });
    res.json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get Attendance by ID (student ID)
export const getAttendanceById = async (req: Request, res: Response) => {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: Number(req.params.id) },
      include: { class: true },
    });

    if (!attendance)
      return res.status(404).json({ error: "Attendance not found" });
    res.json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get Attendance by Class
export const getAttendanceByClass = async (req: Request, res: Response) => {
  try {
    const attendance = await prisma.attendance.findMany({
      where: { classId: Number(req.params.classId) },
      include: { class: true },
      orderBy: { date: "desc" },
    });

    if (!attendance || attendance.length === 0) return [];
    // return res
    //   .status(404)
    //   .json({ error: "No attendance records found for this class" });
    res.json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get Attendance by Class and Date
export const getAttendanceByClassAndDate = async (
  req: Request,
  res: Response
) => {
  try {
    const { classId, date } = req.params;
    const parsedDate = new Date(date);

    const attendance = await prisma.attendance.findFirst({
      where: {
        classId: Number(classId),
        date: {
          gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
          lt: new Date(parsedDate.setHours(23, 59, 59, 999)),
        },
      },
      include: { class: true },
    });

    if (!attendance)
      return res
        .status(404)
        .json({ error: "Attendance not found for this class and date" });
    res.json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Update Attendance by Class ID and Date
export const updateAttendanceByClassAndDate = async (
  req: Request,
  res: Response
) => {
  try {
    const { classId, date } = req.params;
    const { records } = req.body;
    const userId = (req as any).userId;
    const parsedDate = new Date(date);

    // Get the class and verify the teacher is authorized
    const classInfo = await prisma.class.findUnique({
      where: { id: Number(classId) },
      include: { teacher: { include: { user: true } } },
    });

    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Check if the current user is the class teacher
    if (!classInfo.teacher || classInfo.teacher.userId !== userId) {
      return res.status(403).json({
        error:
          "Forbidden: Only the class teacher can update attendance for this class",
      });
    }

    const attendance = await prisma.attendance.updateMany({
      where: {
        classId: Number(classId),
        date: {
          gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
          lt: new Date(parsedDate.setHours(23, 59, 59, 999)),
        },
      },
      data: { records },
    });

    if (attendance.count === 0)
      return res
        .status(404)
        .json({ error: "Attendance not found for this class and date" });

    // Fetch the updated record
    const updatedAttendance = await prisma.attendance.findFirst({
      where: {
        classId: Number(classId),
        date: {
          gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
          lt: new Date(parsedDate.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        class: {
          include: {
            teacher: {
              include: {
                user: { select: { id: true, firstname: true, lastname: true } },
              },
            },
          },
        },
      },
    });

    res.json(updatedAttendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Update Attendance by ID
export const updateAttendanceById = async (req: Request, res: Response) => {
  try {
    const { studentId, date, records } = req.body;
    const userId = (req as any).userId;

    // First get the attendance record to check authorization
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        class: {
          include: {
            teacher: { include: { user: true } },
          },
        },
      },
    });

    if (!existingAttendance) {
      return res.status(404).json({ error: "Attendance not found" });
    }

    // Check if the current user is the class teacher
    if (
      !existingAttendance.class.teacher ||
      existingAttendance.class.teacher.userId !== userId
    ) {
      return res.status(403).json({
        error:
          "Forbidden: Only the class teacher can update attendance for this class",
      });
    }

    const attendance = await prisma.attendance.update({
      where: { id: Number(req.params.id) },
      data: { date, records },
      include: {
        class: {
          include: {
            teacher: {
              include: {
                user: { select: { id: true, firstname: true, lastname: true } },
              },
            },
          },
        },
      },
    });
    res.json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create Attendance
export const createAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId, date, records, classId } = req.body;
    const userId = (req as any).userId;

    // Get the class and verify the teacher is authorized
    const classInfo = await prisma.class.findUnique({
      where: { id: Number(classId) },
      include: { teacher: { include: { user: true } } },
    });

    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Check if the current user is the class teacher
    if (!classInfo.teacher || classInfo.teacher.userId !== userId) {
      return res.status(403).json({
        error:
          "Forbidden: Only the class teacher can mark attendance for this class",
      });
    }

    // Check if attendance already exists for this class and date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        classId: Number(classId),
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        error: "Attendance already exists for this class and date",
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        id: Number(studentId), // Use student ID as attendance ID
        date: new Date(date),
        records,
        classId: Number(classId),
      },
      include: {
        class: {
          include: {
            teacher: {
              include: {
                user: { select: { id: true, firstname: true, lastname: true } },
              },
            },
          },
        },
      },
    });
    res.status(201).json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Attendance
export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // First get the attendance record to check authorization
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        class: {
          include: {
            teacher: { include: { user: true } },
          },
        },
      },
    });

    if (!existingAttendance) {
      return res.status(404).json({ error: "Attendance not found" });
    }

    // Check if the current user is the class teacher
    if (
      !existingAttendance.class.teacher ||
      existingAttendance.class.teacher.userId !== userId
    ) {
      return res.status(403).json({
        error:
          "Forbidden: Only the class teacher can delete attendance for this class",
      });
    }

    await prisma.attendance.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get classes that a teacher can manage attendance for
export const getTeacherClasses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Get the teacher record
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
      include: {
        classes: {
          include: {
            students: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    res.json({
      teacher: {
        id: teacher.id,
        userId: teacher.userId,
      },
      classes: teacher.classes,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create bulk attendance for a class (more practical for teachers)
export const createBulkAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date, attendanceRecords } = req.body;
    const userId = (req as any).userId;

    // Get the class and verify the teacher is authorized
    const classInfo = await prisma.class.findUnique({
      where: { id: Number(classId) },
      include: {
        teacher: { include: { user: true } },
        students: {
          include: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Check if the current user is the class teacher
    if (!classInfo.teacher || classInfo.teacher.userId !== userId) {
      return res.status(403).json({
        error:
          "Forbidden: Only the class teacher can mark attendance for this class",
      });
    }

    // Check if attendance already exists for this class and date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        classId: Number(classId),
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        error: "Attendance already exists for this class and date",
      });
    }

    // Validate attendance records against actual students in the class
    const studentIds = classInfo.students.map((student) => student.id);
    const invalidRecords = attendanceRecords.filter(
      (record: any) => !studentIds.includes(Number(record.studentId))
    );

    if (invalidRecords.length > 0) {
      return res.status(400).json({
        error:
          "Some attendance records contain invalid student IDs for this class",
        invalidRecords,
      });
    }

    // Convert attendance records array to JSON object
    const recordsObject = attendanceRecords.reduce((acc: any, record: any) => {
      acc[record.studentId] = record.status;
      return acc;
    }, {});

    // Create attendance records for each student
    const createdAttendanceRecords = [];
    for (const record of attendanceRecords) {
      const attendance = await prisma.attendance.create({
        data: {
          id: Number(record.studentId), // Use student ID as attendance ID
          date: new Date(date),
          records: { [record.studentId]: record.status },
          classId: Number(classId),
        },
        include: {
          class: {
            include: {
              teacher: {
                include: {
                  user: { select: { id: true, firstname: true, lastname: true } },
                },
              },
            },
          },
        },
      });
      createdAttendanceRecords.push(attendance);
    }

    res.status(201).json({
      message: "Bulk attendance created successfully",
      attendance: createdAttendanceRecords,
      totalRecords: createdAttendanceRecords.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
