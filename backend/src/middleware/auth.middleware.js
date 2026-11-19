import jwt from "jsonwebtoken";
import { SECURITY_CONFIG } from "../config/security.config.js";

// Middleware xác thực định danh người dùng qua JWT
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "AUTHENTICATION_REQUIRED",
      message: "Yêu cầu đăng nhập. Token xác thực không tồn tại hoặc không đúng định dạng Bearer."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECURITY_CONFIG.JWT_SECRET);
    
    // Gán thông tin người dùng đã xác minh danh tính vào request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      full_name: decoded.full_name,
      role: decoded.role
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "TOKEN_EXPIRED",
        message: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại."
      });
    }

    return res.status(401).json({
      success: false,
      error: "INVALID_TOKEN",
      message: "Chữ ký Token không hợp lệ hoặc đã bị can thiệp trái phép."
    });
  }
};
