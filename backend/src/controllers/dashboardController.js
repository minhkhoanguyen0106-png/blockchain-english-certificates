import { pool } from '../config/db.js';

// F01-02: Thống kê tổng quan công khai cho Landing Page (PAGE-001)
export async function getOverviewStats(req, res) {
  try {
    const [[certStats]] = await pool.query(`
      SELECT 
        COUNT(*) AS total_certificates,
        SUM(CASE WHEN status = 'ISSUED_ON_CHAIN' THEN 1 ELSE 0 END) AS total_onchain,
        COUNT(DISTINCT student_id) AS total_students
      FROM certificates
    `);

    const [[courseStats]] = await pool.query('SELECT COUNT(*) AS total_courses FROM courses');

    return res.json({
      success: true,
      data: {
        totalCertificates: certStats.total_certificates || 0,
        totalOnchain: certStats.total_onchain || 0,
        totalStudents: certStats.total_students || 0,
        totalCourses: courseStats.total_courses || 0
      }
    });
  } catch (error) {
    console.error('Lỗi getOverviewStats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// F05-02 & F05-03: Thống kê chi tiết & Biểu đồ cho Admin Dashboard (PAGE-005)
export async function getDashboardStats(req, res) {
  try {
    // 1. Thống kê theo trạng thái (Issued, Pending, Revoked)
    const [[statusStats]] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'ISSUED_ON_CHAIN' THEN 1 ELSE 0 END) AS issued_count,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = 'REVOKED' THEN 1 ELSE 0 END) AS revoked_count
      FROM certificates
    `);

    // 2. Biểu đồ phân bố theo khóa học/kỳ thi
    const [courseDistribution] = await pool.query(`
      SELECT 
        c.course_name,
        c.course_code,
        COUNT(cert.id) AS certificate_count
      FROM courses c
      LEFT JOIN certificates cert ON c.id = cert.course_id
      GROUP BY c.id, c.course_name, c.course_code
      ORDER BY certificate_count DESC
    `);

    return res.json({
      success: true,
      data: {
        totalCertificates: statusStats.total || 0,
        issuedCount: statusStats.issued_count || 0,
        pendingCount: statusStats.pending_count || 0,
        revokedCount: statusStats.revoked_count || 0,
        courseDistribution
      }
    });
  } catch (error) {
    console.error('Lỗi getDashboardStats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// F05-04: Nhật ký thao tác gần đây
export async function getRecentLogs(req, res) {
  try {
    const limit = Number(req.query.limit) || 5;

    const [logs] = await pool.query(`
      SELECT 
        l.id,
        l.action,
        l.action_detail,
        l.note,
        l.created_at,
        u.full_name AS actor_name,
        u.role AS actor_role,
        c.certificate_code,
        s.full_name AS student_name
      FROM issue_logs l
      JOIN users u ON l.action_by = u.id
      JOIN certificates c ON l.certificate_id = c.id
      JOIN students s ON c.student_id = s.id
      ORDER BY l.created_at DESC
      LIMIT ?
    `, [limit]);

    return res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Lỗi getRecentLogs:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
