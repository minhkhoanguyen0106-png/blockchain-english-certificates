import express from 'express';
import cors from 'cors';
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

// Middlewares
app.use(cors({
  origin: '*', // Hỗ trợ kết nối từ frontend Next.js/React
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
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
