import dotenv from 'dotenv';
import app from './app.js';
import { testDbConnection } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('------------------------------------------------------------');
  console.log('🚀 Đang khởi động Backend API Quản lý Chứng chỉ Blockchain...');
  console.log('------------------------------------------------------------');

  // Kiểm tra kết nối CSDL MySQL
  await testDbConnection();

  app.listen(PORT, () => {
    console.log(`📡 Server đang lắng nghe tại: http://localhost:${PORT}`);
    console.log(`🩺 Health check endpoint:   http://localhost:${PORT}/api/health`);
    console.log('------------------------------------------------------------');
    console.log('📋 Danh sách Endpoint khớp với DANH_SACH_CHUC_NANG_GIAO_DIEN:');
    console.log('  [PAGE-001] GET  /api/stats/overview');
    console.log('  [PAGE-002] GET  /api/public/verify/:code');
    console.log('  [PAGE-002] GET  /api/public/pdf/:code');
    console.log('  [PAGE-004] POST /api/auth/login');
    console.log('  [PAGE-004] GET  /api/auth/profile');
    console.log('  [PAGE-005] GET  /api/dashboard/stats');
    console.log('  [PAGE-005] GET  /api/dashboard/logs');
    console.log('  [PAGE-006] POST /api/certificates/draft');
    console.log('  [PAGE-006] POST /api/certificates/prepare-mint');
    console.log('  [PAGE-006] POST /api/certificates/confirm-mint');
    console.log('  [PAGE-007] GET  /api/certificates');
    console.log('  [PAGE-007] POST /api/certificates/:id/revoke');
    console.log('  [PAGE-008] CRUD /api/students & /api/courses');
    console.log('------------------------------------------------------------');
  });
}

startServer();
