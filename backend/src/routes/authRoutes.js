import { Router } from 'express';
import { login, getProfile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

// PAGE-004: Đăng nhập quản trị
router.post('/login', login);

// Lấy thông tin user hiện tại
router.get('/profile', verifyToken, getProfile);

export default router;
