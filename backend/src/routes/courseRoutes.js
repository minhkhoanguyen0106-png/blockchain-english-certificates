import { Router } from 'express';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../controllers/courseController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// PAGE-008: Quản lý danh mục khóa học (F08-02, F06-02)
router.get('/', getCourses); // Có thể public để trang chủ hoặc form đăng ký dùng
router.post('/', verifyToken, requireRole('ADMIN'), createCourse);
router.put('/:id', verifyToken, requireRole('ADMIN'), updateCourse);
router.delete('/:id', verifyToken, requireRole('ADMIN'), deleteCourse);

export default router;
