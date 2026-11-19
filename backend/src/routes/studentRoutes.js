import { Router } from 'express';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// PAGE-008: Quản lý học viên (F08-01, F06-01)
router.get('/', verifyToken, getStudents);
router.post('/', verifyToken, requireRole('ADMIN', 'STAFF'), createStudent);
router.put('/:id', verifyToken, requireRole('ADMIN', 'STAFF'), updateStudent);
router.delete('/:id', verifyToken, requireRole('ADMIN'), deleteStudent);

export default router;
