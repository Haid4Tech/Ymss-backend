import { Router } from 'express';
import * as subjectTeacherController from '../controllers/subjectTeacherController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authMiddleware, subjectTeacherController.getAllSubjectTeachers);
router.post('/', adminMiddleware, subjectTeacherController.assignTeacherToSubject);
router.delete('/', adminMiddleware, subjectTeacherController.removeTeacherFromSubject);
router.get('/subject/:subjectId', authMiddleware, subjectTeacherController.getTeachersForSubject);
router.get('/teacher/:teacherId', authMiddleware, subjectTeacherController.getSubjectsForTeacher);

export default router; 