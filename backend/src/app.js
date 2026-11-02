import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import courseRoutes from './routes/courseRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Bảo vệ HTTP Headers bằng Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. Cấu hình CORS
app.use(cors({
  origin: '*', // Hỗ trợ frontend kết nối
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Rate limiting chống Brute-force & Spam requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Phát hiện quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau 15 phút.'
  }
});
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Phục vụ file tĩnh (PDF chứng chỉ xuất ra)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'English Center Certificate Management on Blockchain API',
    timestamp: new Date().toISOString()
  });
});

// Routing khớp 100% với DANH_SACH_CHUC_NANG_GIAO_DIEN.md
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stats', dashboardRoutes); // Alias cho F01-02 (/api/stats/overview)
app.use('/api/certificates', certificateRoutes);
app.use('/api/public', certificateRoutes); // Alias cho F02-01 & F03-04 (/api/public/verify/:code)
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);

// Xử lý 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`
  });
});

// Xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống nội bộ.'
  });
});

export default app;
