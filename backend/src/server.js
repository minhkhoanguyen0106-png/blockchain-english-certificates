import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { SECURITY_CONFIG } from "./config/security.config.js";
import { authenticateJWT } from "./middleware/auth.middleware.js";
import { requireAdmin, requireStaffOrAdmin } from "./middleware/rbac.middleware.js";
import * as authController from "./controllers/auth.controller.js";
import * as certController from "./controllers/certificate.controller.js";

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Bảo vệ tầng HTTP Headers bằng Helmet
app.use(helmet());

// 2. Cấu hình CORS an toàn
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));

// 3. Cơ chế Rate Limiting (Chống Brute-force & DDoS)
const apiLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS,
  max: SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    error: "TOO_MANY_REQUESTS",
    message: "Hệ thống phát hiện quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau 15 phút."
  }
});

const loginLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS,
  max: SECURITY_CONFIG.RATE_LIMIT.AUTH_MAX_REQUESTS,
  message: {
    success: false,
    error: "AUTH_BRUTE_FORCE_BLOCKED",
    message: "Bạn đã thử đăng nhập sai quá nhiều lần. Để bảo mật tài khoản, IP tạm thời bị khóa 15 phút."
  }
});

app.use("/api/", apiLimiter);

// ==========================================
// 4. ĐỊNH TUYẾN API VỚI PHÂN QUYỀN CHẶT CHẼ
// ==========================================

// --- A. PUBLIC ENDPOINTS (Không cần đăng nhập) ---
app.post("/api/auth/login", loginLimiter, authController.login);
app.get("/api/certificates/verify/:code", certController.verifyPublicCertificate);

// --- B. AUTHENTICATED ENDPOINTS (Bắt buộc phải có JWT hợp lệ) ---
app.get("/api/auth/me", authenticateJWT, authController.getMe);
app.get("/api/certificates", authenticateJWT, certController.getCertificatesList);

// --- C. STAFF & ADMIN ENDPOINTS (Cán bộ & Quản trị) ---
app.post("/api/certificates/draft", authenticateJWT, requireStaffOrAdmin, certController.createDraftCertificate);

// --- D. ADMIN ONLY ENDPOINTS (Chỉ Quản trị viên cấp cao) ---
app.post("/api/certificates/:id/mint", authenticateJWT, requireAdmin, certController.mintCertificateOnChain);
app.post("/api/certificates/:id/revoke", authenticateJWT, requireAdmin, certController.revokeCertificate);
app.get("/api/admin/audit-logs", authenticateJWT, requireAdmin, certController.getAuditLogs);

// 5. Xử lý Route không tồn tại (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "ENDPOINT_NOT_FOUND",
    message: "Đường dẫn API không tồn tại."
  });
});

// 6. Global Error Handler (Không bao giờ rò rỉ stack trace ra ngoài)
app.use((err, req, res, next) => {
  console.error("[SECURITY LOG - SERVER ERROR]:", err.message);
  res.status(err.status || 500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message: "Đã xảy ra lỗi nội bộ trong quá trình xử lý yêu cầu."
  });
});

// Khởi chạy server nếu chạy trực tiếp
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[CERTCHAIN BACKEND] Server bảo mật đang lắng nghe tại: http://localhost:${PORT}`);
  });
}

export default app;
