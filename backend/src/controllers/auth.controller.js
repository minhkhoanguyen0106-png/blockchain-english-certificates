import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SECURITY_CONFIG } from "../config/security.config.js";
import { recordAuditLog } from "../middleware/audit.middleware.js";

// Khởi tạo người dùng mẫu với mật khẩu được băm bằng bcrypt tiêu chuẩn
const HASHED_PASSWORD_DEFAULT = bcrypt.hashSync("123456", SECURITY_CONFIG.SALT_ROUNDS);

export const USERS_DB = [
  {
    id: 1,
    username: "admin_khoa",
    password_hash: HASHED_PASSWORD_DEFAULT,
    full_name: "Nguyễn Thị Minh Khoa (Giám Đốc)",
    role: "ADMIN"
  },
  {
    id: 2,
    username: "staff_long",
    password_hash: HASHED_PASSWORD_DEFAULT,
    full_name: "Trần Bảo Long (Cán Bộ Khảo Thí)",
    role: "STAFF"
  },
  {
    id: 3,
    username: "student_yen",
    password_hash: HASHED_PASSWORD_DEFAULT,
    full_name: "Lê Hoàng Yến (Học Viên IELTS)",
    role: "STUDENT"
  }
];

// 1. Đăng nhập và cấp phát JWT
export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "MISSING_CREDENTIALS",
      message: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu."
    });
  }

  // Tìm người dùng theo username
  const user = USERS_DB.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

  if (!user) {
    // Trả về thông báo chung để tránh tấn công User Enumeration
    return res.status(401).json({
      success: false,
      error: "INVALID_CREDENTIALS",
      message: "Tên đăng nhập hoặc mật khẩu không chính xác."
    });
  }

  // So sánh mật khẩu băm với bcrypt
  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    recordAuditLog({
      actionBy: { id: user.id, username: user.username, role: user.role },
      action: "LOGIN_FAILED",
      note: "Sai mật khẩu",
      ip: req.ip
    });

    return res.status(401).json({
      success: false,
      error: "INVALID_CREDENTIALS",
      message: "Tên đăng nhập hoặc mật khẩu không chính xác."
    });
  }

  // Tạo JWT Token có thời hạn và chữ ký bảo mật
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    },
    SECURITY_CONFIG.JWT_SECRET,
    { expiresIn: SECURITY_CONFIG.JWT_EXPIRES_IN }
  );

  // Ghi nhật ký kiểm toán đăng nhập thành công
  recordAuditLog({
    actionBy: { id: user.id, username: user.username, role: user.role },
    action: "LOGIN_SUCCESS",
    note: `Đăng nhập thành công với vai trò ${user.role}`,
    ip: req.ip
  });

  // Trả về dữ liệu an toàn (KHÔNG BAO GIỜ để lộ password_hash)
  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    }
  });
};

// 2. Lấy thông tin phiên làm việc hiện tại từ Token
export const getMe = (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};
