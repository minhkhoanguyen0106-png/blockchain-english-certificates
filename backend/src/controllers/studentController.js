import { pool } from '../config/db.js';

// F08-01 & F06-01: Lấy danh sách học viên
export async function getStudents(req, res) {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM students';
    const params = [];

    if (search) {
      query += ' WHERE full_name LIKE ? OR student_code LIKE ? OR citizen_id LIKE ? OR email LIKE ?';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Thêm học viên mới
export async function createStudent(req, res) {
  try {
    const { student_code, citizen_id, full_name, email, date_of_birth, phone, wallet_address } = req.body;

    if (!student_code || !citizen_id || !full_name || !email || !date_of_birth) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: Mã học viên, CCCD, Họ tên, Email, Ngày sinh.'
      });
    }

    const [result] = await pool.query(`
      INSERT INTO students (student_code, citizen_id, full_name, email, date_of_birth, phone, wallet_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [student_code, citizen_id, full_name, email, date_of_birth, phone || null, wallet_address || null]);

    return res.status(201).json({
      success: true,
      message: 'Thêm học viên thành công.',
      data: { id: result.insertId, ...req.body }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Mã học viên, CCCD hoặc Email đã tồn tại.' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Cập nhật thông tin học viên
export async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const { citizen_id, full_name, email, date_of_birth, phone, wallet_address } = req.body;

    await pool.query(`
      UPDATE students 
      SET citizen_id = ?, full_name = ?, email = ?, date_of_birth = ?, phone = ?, wallet_address = ?
      WHERE id = ?
    `, [citizen_id, full_name, email, date_of_birth, phone || null, wallet_address || null, id]);

    return res.json({ success: true, message: 'Cập nhật học viên thành công.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Xóa học viên
export async function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM students WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Xóa học viên thành công.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
