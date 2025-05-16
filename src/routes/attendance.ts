import { Router } from 'express';
import * as attendanceController from '../controllers/attendanceController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authMiddleware, attendanceController.getAllAttendance);
router.get('/:studentId', authMiddleware, attendanceController.getAttendanceByStudent);
router.post('/', authMiddleware, attendanceController.markAttendance);

export default router;