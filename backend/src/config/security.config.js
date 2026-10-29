// Cấu hình bảo mật ứng dụng CertChain
export const SECURITY_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || "CertChain_Secured_Secret_Key_@2026_Strict_Blockchain_Auth",
  JWT_EXPIRES_IN: "2h",
  SALT_ROUNDS: 10,
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 phút
    MAX_REQUESTS: 200,          // Tối đa 200 requests/15 phút cho API chung
    AUTH_MAX_REQUESTS: 10      // Tối đa 10 lần thử đăng nhập/15 phút (chống Brute-force)
  },
  ROLES: {
    ADMIN: "ADMIN",
    STAFF: "STAFF",
    STUDENT: "STUDENT"
  }
};
