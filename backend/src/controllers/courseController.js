import { pool } from '../config/db.js';

// F08-02 & F06-02: Lấy danh mục khóa học
export async function getCourses(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM courses ORDER BY id ASC');
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Thêm khóa học mới
export async function createCourse(req, res) {
  try {
    const { course_code, course_name, score_type, max_score, duration, description } = req.body;

    if (!course_code || !course_name) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp Mã khóa học và Tên khóa học.' });
    }

    const [result] = await pool.query(`
      INSERT INTO courses (course_code, course_name, score_type, max_score, duration, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [course_code, course_name, score_type || 'IELTS', max_score || '9.0', duration || '3 tháng', description || null]);

    return res.status(201).json({
      success: true,
      message: 'Thêm khóa học thành công.',
      data: { id: result.insertId, ...req.body }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Mã khóa học này đã tồn tại.' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Cập nhật khóa học
export async function updateCourse(req, res) {
  try {
    const { id } = req.params;
    const { course_name, score_type, max_score, duration, description } = req.body;

    await pool.query(`
      UPDATE courses 
      SET course_name = ?, score_type = ?, max_score = ?, duration = ?, description = ?
      WHERE id = ?
    `, [course_name, score_type, max_score, duration, description, id]);

    return res.json({ success: true, message: 'Cập nhật khóa học thành công.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Xóa khóa học
export async function deleteCourse(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM courses WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Xóa khóa học thành công.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
