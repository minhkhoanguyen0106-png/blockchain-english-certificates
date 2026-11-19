import { Router } from 'express';
import { getOverviewStats, getDashboardStats, getRecentLogs } from '../controllers/dashboardController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// PAGE-001 (F01-02): Thống kê công khai cho Landing Page
router.get('/overview', getOverviewStats);

// PAGE-005 (F05-02 & F05-03): Thống kê Dashboard quản trị
router.get('/stats', verifyToken, requireRole('ADMIN', 'STAFF'), getDashboardStats);

// PAGE-005 (F05-04): Nhật ký thao tác gần đây
router.get('/logs', verifyToken, requireRole('ADMIN', 'STAFF'), getRecentLogs);

export default router;
