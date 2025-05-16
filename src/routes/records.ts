import { Router } from 'express';
import * as recordController from '../controllers/recordController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authMiddleware, recordController.getAllRecords);
router.get('/:studentId', authMiddleware, recordController.getRecordsByStudent);
router.post('/', authMiddleware, recordController.createRecord);

export default router;