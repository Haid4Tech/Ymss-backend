import { Request, Response } from "express";
import { prisma } from "../app";
import { AttendanceStatus } from "@prisma/client";

// Get All Attendance data
export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await prisma.attendance.findMany({
      include: { 
        class: true,
        student: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true, email: true }
            }
          }
        },
        teacher: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true }
            }
          }
        }
      },
      orderBy: { date: "desc" },
    });
    res.json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get Attendance by ID
export const getAttendanceById = async (req: Request, res: Response) => {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: Number(req.params.id) },
      include: { 
        class: true,
        student: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true, email: true }
            }
          }
        },
        teacher: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true }
            }
          }
        }
      },
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
      include: { 
        class: true,
        student: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true, email: true }
            }
          }
        },
        teacher: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true }
            }
          }
        }
      },
      orderBy: { date: "desc" },
    });

    if (!attendance || attendance.length === 0) return res.json([]);
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

    const attendance = await prisma.attendance.findMany({
      where: {
        classId: Number(classId),
        date: {
          gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
          lt: new Date(parsedDate.setHours(23, 59, 59, 999)),
        },
      },
      include: { 
        class: true,
        student: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true, email: true }
            }
          }
        },
        teacher: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get Attendance by Student
export const getAttendanceByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const attendance = await prisma.attendance.findMany({
      where: { studentId: Number(studentId) },
      include: { 
        class: true,
        student: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true, email: true }
            }
          }
        },
        teacher: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true }
            }
          }
        }
      },
      orderBy: { date: "desc" },
    });

    res.json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create Single Attendance Record
export const createAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId, classId, date, status, notes } = req.body;
    const userId = (req as any).userId;

    // Get the teacher record first to get the teacher ID
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
    });

    if (!teacher) {
      return res.status(403).json({
        error: "Forbidden: Teacher not found",
      });
    }

    // Get the class and verify the teacher is authorized
    const classInfo = await prisma.class.findUnique({
      where: { id: Number(classId) },
    });

    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Check if the current teacher is assigned to this class
    if (!classInfo.teacherId || classInfo.teacherId !== teacher.id) {
      return res.status(403).json({
        error: "Forbidden: Only the class teacher can mark attendance for this class",
      });
    }

    // Check if attendance already exists for this student, class and date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: Number(studentId),
        classId: Number(classId),
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        error: "Attendance already exists for this student, class and date",
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId: Number(studentId),
        classId: Number(classId),
        date: new Date(date),
        status,
        notes: notes || null,
        markedBy: teacher.id,
      },
      include: { 
        class: true,
        student: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true, email: true }
            }
          }
        },
        teacher: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true }
            }
          }
        }
      },
    });

    res.status(201).json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create Bulk Attendance for a Class
export const createBulkAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date, attendanceRecords } = req.body;
    const userId = (req as any).userId;

    // Get the teacher record first to get the teacher ID
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
    });

    if (!teacher) {
      return res.status(403).json({
        error: "Forbidden: Teacher not found",
      });
    }

    // Get the class and verify the teacher is authorized
    const classInfo = await prisma.class.findUnique({
      where: { id: Number(classId) },
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
    });

    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Check if the current teacher is assigned to this class
    if (!classInfo.teacherId || classInfo.teacherId !== teacher.id) {
      return res.status(403).json({
        error: "Forbidden: Only the class teacher can mark attendance for this class",
      });
    }

    // Validate attendance records against actual students in the class
    const studentIds = classInfo.students.map((student) => student.id);
    const invalidRecords = attendanceRecords.filter(
      (record: any) => !studentIds.includes(Number(record.studentId))
    );

    if (invalidRecords.length > 0) {
      return res.status(400).json({
        error: "Some students are not in this class",
        invalidRecords,
      });
    }

    // Check if attendance already exists for this class and date
    const existingAttendance = await prisma.attendance.findMany({
      where: {
        classId: Number(classId),
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existingAttendance.length > 0) {
      return res.status(400).json({
        error: "Attendance already exists for this class and date",
      });
    }

    // Create attendance records for each student
    const createdAttendanceRecords = [];
    for (const record of attendanceRecords) {
      const attendance = await prisma.attendance.create({
        data: {
          studentId: Number(record.studentId),
          classId: Number(classId),
          date: new Date(date),
          status: record.status,
          notes: record.notes || null,
          markedBy: teacher.id,
        },
        include: { 
          class: true,
          student: {
            include: {
              user: {
                select: { id: true, firstname: true, lastname: true, email: true }
              }
            }
          },
          teacher: {
            include: {
              user: {
                select: { id: true, firstname: true, lastname: true }
              }
            }
          }
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

// Update Attendance by ID
export const updateAttendanceById = async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const userId = (req as any).userId;

    // Get the teacher record first to get the teacher ID
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
    });

    if (!teacher) {
      return res.status(403).json({
        error: "Forbidden: Teacher not found",
      });
    }

    // First get the attendance record to check authorization
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        class: true,
      },
    });

    if (!existingAttendance) {
      return res.status(404).json({ error: "Attendance not found" });
    }

    // Check if the current teacher is assigned to this class
    if (
      !existingAttendance.class.teacherId ||
      existingAttendance.class.teacherId !== teacher.id
    ) {
      return res.status(403).json({
        error: "Forbidden: Only the class teacher can update attendance for this class",
      });
    }

    const attendance = await prisma.attendance.update({
      where: { id: Number(req.params.id) },
      data: { 
        status,
        notes: notes || null,
        markedBy: teacher.id,
      },
      include: { 
        class: true,
        student: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true, email: true }
            }
          }
        },
        teacher: {
          include: {
            user: {
              select: { id: true, firstname: true, lastname: true }
            }
          }
        }
      },
    });

    res.json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Attendance
export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Get the teacher record first to get the teacher ID
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
    });

    if (!teacher) {
      return res.status(403).json({
        error: "Forbidden: Teacher not found",
      });
    }

    // First get the attendance record to check authorization
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        class: true,
      },
    });

    if (!existingAttendance) {
      return res.status(404).json({ error: "Attendance not found" });
    }

    // Check if the current teacher is assigned to this class
    if (
      !existingAttendance.class.teacherId ||
      existingAttendance.class.teacherId !== teacher.id
    ) {
      return res.status(403).json({
        error: "Forbidden: Only the class teacher can delete attendance for this class",
      });
    }

    await prisma.attendance.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: "Attendance deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get Teacher Classes
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

// Get Attendance Statistics for a Class
export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const whereClause: any = {
      classId: Number(classId),
    };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: { firstname: true, lastname: true }
            }
          }
        }
      },
    });

    // Calculate statistics
    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
    const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
    const lateCount = attendance.filter(a => a.status === 'LATE').length;
    const excusedCount = attendance.filter(a => a.status === 'EXCUSED').length;

    const stats = {
      totalRecords,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      excused: excusedCount,
      attendanceRate: totalRecords > 0 ? ((presentCount + lateCount) / totalRecords) * 100 : 0,
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};