import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy Token xác thực. Vui lòng đăng nhập.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');

    // Kiểm tra trạng thái & vai trò hiện thời trong CSDL để thu hồi ngay nếu tài khoản bị khóa/đổi quyền
    const [[dbUser]] = await pool.query(
      'SELECT id, username, full_name, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không còn tồn tại trên hệ thống.'
      });
    }

    if (dbUser.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Phiên làm việc đã bị thu hồi.'
      });
    }

    req.user = {
      ...decoded,
      id: dbUser.id,
      username: dbUser.username,
      fullName: dbUser.full_name,
      role: dbUser.role
    };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn.'
    });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này.'
      });
    }
    next();
  };
}
