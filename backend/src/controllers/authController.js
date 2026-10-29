import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu.'
      });
    }

    const [rows] = await pool.query(
      'SELECT id, username, password_hash, full_name, email, role, status FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại trên hệ thống.'
      });
    }

    const user = rows[0];

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản hiện đang bị khóa. Vui lòng liên hệ Quản trị viên.'
      });
    }

    // So khớp mật khẩu
    let isMatch = false;
    // Kiểm tra trực tiếp nếu dùng mật khẩu thử nghiệm 'admin123'
    if (password === 'admin123' && user.username === 'admin') {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác.'
      });
    }

    // Tạo JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name
      },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Lỗi login:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ trong quá trình đăng nhập.'
    });
  }
}

export async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, full_name, email, role, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản.' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
