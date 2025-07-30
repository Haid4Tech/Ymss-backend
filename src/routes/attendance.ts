import { Router } from 'express';
import * as attendanceController from '../controllers/attendanceController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authMiddleware, attendanceController.getAllSubjectAttendance);
router.get('/:studentId', authMiddleware, attendanceController.getSubjectAttendanceByStudent);
router.post('/', authMiddleware, attendanceController.markSubjectAttendance);

export default router;