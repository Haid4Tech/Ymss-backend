import { Request, Response } from "express";
import { prisma } from "../app";

export const getAllSubjectAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await prisma.subjectAttendance.findMany({
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: true,
                class: true,
              },
            },
            subject: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });
    res.json({ attendance, page: 1, limit: 100, total: attendance.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markSubjectAttendance = async (req: Request, res: Response) => {
  const { enrollmentId, date, status } = req.body;
  try {
    const attendance = await prisma.subjectAttendance.create({
      data: { enrollmentId, date: new Date(date), status },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: true,
                class: true,
              },
            },
            subject: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });
    res.status(201).json(attendance);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// New function: Get attendance by class and date
export const getAttendanceByClassAndDate = async (req: Request, res: Response) => {
  try {
    const { classId, date } = req.params;
    const parsedDate = new Date(date);
    
    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId: Number(classId) },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        class: true,
        enrollments: {
          include: {
            subject: true,
            attendance: {
              where: {
                date: {
                  gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
                  lt: new Date(parsedDate.setHours(23, 59, 59, 999)),
                },
              },
            },
          },
        },
      },
    });

    // Format the response to show attendance status for each student
    const formattedAttendance = students.map(student => ({
      studentId: student.id,
      userId: student.user.id,
      firstname: student.user.firstname,
      lastname: student.user.lastname,
      email: student.user.email,
      class: student.class,
      subjects: student.enrollments.map(enrollment => ({
        subjectId: enrollment.subject.id,
        subjectName: enrollment.subject.name,
        attendance: enrollment.attendance.length > 0 ? enrollment.attendance[0] : null,
      })),
    }));

    res.json({
      classId: Number(classId),
      date: parsedDate,
      attendance: formattedAttendance,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// New function: Take bulk attendance for a class on a specific date
export const takeClassAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date, attendanceData } = req.body;
    const teacherId = (req as any).userId;
    
    // Verify the teacher has access to this class
    const classInfo = await prisma.class.findFirst({
      where: {
        id: Number(classId),
        teacherId: Number(teacherId),
      },
    });

    if (!classInfo) {
      return res.status(403).json({ 
        error: "Forbidden: You can only take attendance for classes you teach" 
      });
    }

    const parsedDate = new Date(date);
    const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));

    // Process attendance data
    const results = [];
    
    for (const record of attendanceData) {
      const { studentId, subjectId, status } = record;
      
      // Find the enrollment for this student and subject
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: Number(studentId),
          subjectId: Number(subjectId),
        },
      });

      if (!enrollment) {
        results.push({
          studentId,
          subjectId,
          status: 'ERROR',
          message: 'Enrollment not found',
        });
        continue;
      }

      // Check if attendance already exists for this date
      const existingAttendance = await prisma.subjectAttendance.findFirst({
        where: {
          enrollmentId: enrollment.id,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      let attendanceRecord;
      
      if (existingAttendance) {
        // Update existing attendance
        attendanceRecord = await prisma.subjectAttendance.update({
          where: { id: existingAttendance.id },
          data: { status },
          include: {
            enrollment: {
              include: {
                student: {
                  include: {
                    user: true,
                    class: true,
                  },
                },
                subject: {
                  include: {
                    class: true,
                  },
                },
              },
            },
          },
        });
      } else {
        // Create new attendance
        attendanceRecord = await prisma.subjectAttendance.create({
          data: {
            enrollmentId: enrollment.id,
            date: parsedDate,
            status,
          },
          include: {
            enrollment: {
              include: {
                student: {
                  include: {
                    user: true,
                    class: true,
                  },
                },
                subject: {
                  include: {
                    class: true,
                  },
                },
              },
            },
          },
        });
      }

      results.push({
        studentId,
        subjectId,
        status: 'SUCCESS',
        attendance: attendanceRecord,
      });
    }

    res.status(200).json({
      message: 'Attendance taken successfully',
      date: parsedDate,
      classId: Number(classId),
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// New function: Get attendance summary for a class
export const getClassAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate as string) : new Date();
    
    // Get all students in the class with their attendance
    const students = await prisma.student.findMany({
      where: { classId: Number(classId) },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
          },
        },
        enrollments: {
          include: {
            subject: true,
            attendance: {
              where: {
                date: {
                  gte: start,
                  lte: end,
                },
              },
            },
          },
        },
      },
    });

    // Calculate attendance statistics for each student
    const summary = students.map(student => {
      const totalDays = student.enrollments.reduce((acc, enrollment) => {
        return acc + enrollment.attendance.length;
      }, 0);
      
      const presentDays = student.enrollments.reduce((acc, enrollment) => {
        return acc + enrollment.attendance.filter(a => a.status === 'PRESENT').length;
      }, 0);
      
      const absentDays = student.enrollments.reduce((acc, enrollment) => {
        return acc + enrollment.attendance.filter(a => a.status === 'ABSENT').length;
      }, 0);
      
      const lateDays = student.enrollments.reduce((acc, enrollment) => {
        return acc + enrollment.attendance.filter(a => a.status === 'LATE').length;
      }, 0);
      
      const excusedDays = student.enrollments.reduce((acc, enrollment) => {
        return acc + enrollment.attendance.filter(a => a.status === 'EXCUSED').length;
      }, 0);
      
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      
      return {
        studentId: student.id,
        firstname: student.user.firstname,
        lastname: student.user.lastname,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
      };
    });

    res.json({
      classId: Number(classId),
      period: { start, end },
      summary,
      totalStudents: students.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAttendanceByEnrollment = async (
  req: Request,
  res: Response
) => {
  const enrollmentId = Number(req.params.enrollmentId);
  const records = await prisma.subjectAttendance.findMany({
    where: { enrollmentId },
    include: {
      enrollment: {
        include: {
          student: {
            include: {
              user: true,
              class: true,
            },
          },
          subject: {
            include: {
              class: true,
            },
          },
        },
      },
    },
  });
  res.json(records);
};

export const getAttendanceBySubject = async (req: Request, res: Response) => {
  const subjectId = Number(req.params.subjectId);
  const records = await prisma.subjectAttendance.findMany({
    where: { enrollment: { subjectId } },
    include: {
      enrollment: {
        include: {
          student: {
            include: {
              user: true,
              class: true,
            },
          },
          subject: {
            include: {
              class: true,
            },
          },
        },
      },
    },
  });
  res.json(records);
};

export const getAttendanceByStudent = async (req: Request, res: Response) => {
  const studentId = Number(req.params.studentId);
  const records = await prisma.subjectAttendance.findMany({
    where: { enrollment: { studentId } },
    include: {
      enrollment: {
        include: {
          subject: {
            include: {
              class: true,
            },
          },
          student: {
            include: {
              user: true,
              class: true,
            },
          },
        },
      },
    },
  });
  res.json(records);
};
