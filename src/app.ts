import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import studentRoutes from "./routes/students";
import parentRoutes from "./routes/parents";
import teacherRoutes from "./routes/teachers";
import classRoutes from "./routes/classes";
import subjectRoutes from "./routes/subjects";
import attendanceRoutes from "./routes/attendance";
import gradeRoutes from "./routes/grades";
import announcementRoutes from "./routes/announcements";
import recordRoutes from "./routes/records";
import examRoutes from "./routes/exams";
import eventRoutes from "./routes/events";

dotenv.config();

const app = express();
export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/students", studentRoutes);
app.use("/parents", parentRoutes);
app.use("/teachers", teacherRoutes);
app.use("/classes", classRoutes);
app.use("/subjects", subjectRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/grades", gradeRoutes);
app.use("/announcements", announcementRoutes);
app.use("/records", recordRoutes);
app.use("/exams", examRoutes);
app.use("/events", eventRoutes);

export default app;
