import { pool } from '../config/db.js';
import { generateCertificatePdf } from '../services/pdfService.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================================================================
// 1. PUBLIC APIS (PAGE-002 & PAGE-003: KHÔNG CẦN TOKEN ĐĂNG NHẬP)
// ================================================================

// F02-01 & F02-02 & F02-03 & F02-04: Tra cứu và xác thực chứng chỉ
export async function publicVerifyCertificate(req, res) {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã chứng chỉ hoặc CCCD cần tra cứu.' });
    }

    const [rows] = await pool.query(`
      SELECT 
        c.id, c.certificate_code, c.score_overall, c.score_listening, c.score_reading, 
        c.score_writing, c.score_speaking, c.issue_date, c.expiry_date,
        c.token_id, c.tx_hash, c.ipfs_hash, c.ipfs_metadata_url, c.pdf_url,
        c.status, c.revoke_reason, c.revoked_at,
        s.student_code, s.full_name AS student_name, s.citizen_id, s.wallet_address AS student_wallet,
        co.course_code, co.course_name, co.score_type, co.max_score
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      JOIN courses co ON c.course_id = co.id
      WHERE c.certificate_code = ? OR c.token_id = ? OR s.citizen_id = ?
      ORDER BY c.issue_date DESC
    `, [code, code, code]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chứng chỉ tương ứng trên hệ thống hoặc mã không hợp lệ.'
      });
    }

    return res.json({
      success: true,
      data: rows[0],
      totalFound: rows.length
    });
  } catch (error) {
    console.error('Lỗi publicVerifyCertificate:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// F02-06: Tải hoặc xem phôi file PDF chứng chỉ
export async function downloadCertificatePdf(req, res) {
  try {
    const { code } = req.params;

    const [rows] = await pool.query(
      'SELECT certificate_code, pdf_url FROM certificates WHERE certificate_code = ?',
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Chứng chỉ không tồn tại.' });
    }

    const cert = rows[0];
    const filePath = path.join(__dirname, '../../uploads/certificates', `${cert.certificate_code}.pdf`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File PDF chứng chỉ chưa được khởi tạo trên server.' });
    }

    return res.download(filePath, `${cert.certificate_code}.pdf`);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ================================================================
// 2. ADMIN APIS (PAGE-006 & PAGE-007: YÊU CẦU ĐĂNG NHẬP)
// ================================================================

// F07-01 & F07-02: Lấy danh sách chứng chỉ có phân trang và bộ lọc
export async function getCertificates(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const { status, courseId, search } = req.query;

    let whereClause = '1=1';
    const params = [];

    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    if (courseId) {
      whereClause += ' AND c.course_id = ?';
      params.push(courseId);
    }

    if (search) {
      whereClause += ' AND (c.certificate_code LIKE ? OR s.full_name LIKE ? OR s.student_code LIKE ? OR s.citizen_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    // Đếm tổng số bản ghi
    const [[countResult]] = await pool.query(
      `SELECT COUNT(*) AS total FROM certificates c 
       JOIN students s ON c.student_id = s.id 
       WHERE ${whereClause}`,
      params
    );

    // Lấy danh sách bản ghi
    const [rows] = await pool.query(`
      SELECT 
        c.id, c.certificate_code, c.score_overall, c.issue_date, c.expiry_date,
        c.token_id, c.tx_hash, c.status, c.pdf_url, c.created_at,
        s.student_code, s.full_name AS student_name, s.citizen_id,
        co.course_code, co.course_name
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      JOIN courses co ON c.course_id = co.id
      WHERE ${whereClause}
      ORDER BY c.id DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Lỗi getCertificates:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Lấy chi tiết một chứng chỉ
export async function getCertificateById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        c.*,
        s.student_code, s.full_name AS student_name, s.citizen_id, s.wallet_address AS student_wallet, s.email AS student_email,
        co.course_code, co.course_name, co.score_type
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      JOIN courses co ON c.course_id = co.id
      WHERE c.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Chứng chỉ không tồn tại.' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// F06-04: Lưu bản nháp (Draft) chứng chỉ
export async function createDraftCertificate(req, res) {
  try {
    const {
      student_id, course_id, certificate_code,
      score_overall, score_listening, score_reading, score_writing, score_speaking,
      issue_date, expiry_date
    } = req.body;

    if (!student_id || !course_id || !certificate_code || !score_overall || !issue_date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các thông tin bắt buộc (Học viên, Khóa học, Mã bằng, Điểm, Ngày cấp).'
      });
    }

    // Kiểm tra trùng mã bằng
    const [existing] = await pool.query('SELECT id FROM certificates WHERE certificate_code = ?', [certificate_code]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Mã chứng chỉ này đã tồn tại trong hệ thống.' });
    }

    // Lấy thông tin học viên & khóa học để sinh trước file PDF
    const [[student]] = await pool.query('SELECT full_name, student_code, citizen_id FROM students WHERE id = ?', [student_id]);
    const [[course]] = await pool.query('SELECT course_name FROM courses WHERE id = ?', [course_id]);

    const pdfUrl = await generateCertificatePdf({
      certificate_code,
      student_name: student.full_name,
      student_code: student.student_code,
      citizen_id: student.citizen_id,
      course_name: course.course_name,
      score_overall,
      score_listening,
      score_reading,
      score_writing,
      score_speaking,
      issue_date,
      expiry_date
    });

    const [result] = await pool.query(`
      INSERT INTO certificates (
        certificate_code, student_id, course_id,
        score_overall, score_listening, score_reading, score_writing, score_speaking,
        issue_date, expiry_date, pdf_url, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `, [
      certificate_code, student_id, course_id,
      score_overall, score_listening, score_reading, score_writing, score_speaking,
      issue_date, expiry_date || null, pdfUrl, req.user.id
    ]);

    // Ghi nhật ký
    await pool.query(`
      INSERT INTO issue_logs (certificate_id, action_by, action, action_detail, note)
      VALUES (?, ?, 'CREATE_DRAFT', ?, ?)
    `, [
      result.insertId, req.user.id,
      `Tạo bản nháp mã ${certificate_code}`,
      `Lưu bản nháp chứng chỉ cho học viên ${student.full_name}`
    ]);

    return res.status(201).json({
      success: true,
      message: 'Lưu bản nháp chứng chỉ thành công.',
      data: {
        id: result.insertId,
        certificate_code,
        pdf_url: pdfUrl,
        status: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Lỗi createDraftCertificate:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// F06-05: Chuẩn bị dữ liệu để đúc lên Blockchain (Prepare Mint & IPFS Metadata)
export async function prepareMintCertificate(req, res) {
  try {
    const { certificate_id } = req.body;

    const [rows] = await pool.query(`
      SELECT 
        c.*,
        s.full_name AS student_name, s.student_code, s.citizen_id, s.wallet_address AS student_wallet,
        co.course_name, co.course_code
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      JOIN courses co ON c.course_id = co.id
      WHERE c.id = ?
    `, [certificate_id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chứng chỉ.' });
    }

    const cert = rows[0];

    // Cấu trúc IPFS Metadata chuẩn ERC-721 Metadata Schema
    const ipfsMetadata = {
      name: `${cert.course_name} Certificate - ${cert.student_name}`,
      description: `Soulbound English Language Certificate issued by Vietnam English Education Center on Blockchain. Non-transferable.`,
      image: cert.pdf_url || `https://gateway.pinata.cloud/ipfs/placeholder-cert.png`,
      attributes: [
        { trait_type: "Certificate Code", value: cert.certificate_code },
        { trait_type: "Student Name", value: cert.student_name },
        { trait_type: "Student Code", value: cert.student_code },
        { trait_type: "Citizen ID", value: cert.citizen_id },
        { trait_type: "Course", value: cert.course_name },
        { trait_type: "Score Overall", value: cert.score_overall },
        { trait_type: "Issue Date", value: cert.issue_date },
        { trait_type: "Expiry Date", value: cert.expiry_date || "Lifetime" }
      ]
    };

    // Tạo mock CID cho IPFS (hoặc tích hợp Pinata API nếu có API key)
    const mockIpfsHash = `Qm${Buffer.from(cert.certificate_code + Date.now()).toString('hex').substring(0, 44)}`;
    const ipfsMetadataUrl = `https://gateway.pinata.cloud/ipfs/${mockIpfsHash}`;

    // Cập nhật URL IPFS vào database
    await pool.query(
      'UPDATE certificates SET ipfs_hash = ?, ipfs_metadata_url = ? WHERE id = ?',
      [mockIpfsHash, ipfsMetadataUrl, cert.id]
    );

    return res.json({
      success: true,
      message: 'Chuẩn bị dữ liệu đúc on-chain thành công.',
      data: {
        certificate_id: cert.id,
        certificate_code: cert.certificate_code,
        student_wallet: cert.student_wallet,
        ipfs_hash: mockIpfsHash,
        ipfs_metadata_url: ipfsMetadataUrl,
        metadata: ipfsMetadata
      }
    });
  } catch (error) {
    console.error('Lỗi prepareMintCertificate:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// F06-05 & F06-06: Xác nhận đúc on-chain thành công sau khi MetaMask ký
export async function confirmMintCertificate(req, res) {
  try {
    const { certificate_id, tx_hash, token_id } = req.body;

    if (!certificate_id || !tx_hash) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin mã chứng chỉ hoặc Transaction Hash.'
      });
    }

    await pool.query(`
      UPDATE certificates 
      SET tx_hash = ?, token_id = ?, status = 'ISSUED_ON_CHAIN'
      WHERE id = ?
    `, [tx_hash, token_id || '1', certificate_id]);

    // Ghi log
    await pool.query(`
      INSERT INTO issue_logs (certificate_id, action_by, action, action_detail, note)
      VALUES (?, ?, 'MINT_BLOCKCHAIN', ?, ?)
    `, [
      certificate_id, req.user.id,
      `Đúc SBT on-chain thành công (TxHash: ${tx_hash.substring(0, 16)}...)`,
      `Token ID: ${token_id || 'N/A'}`
    ]);

    return res.json({
      success: true,
      message: 'Xác nhận đúc chứng chỉ on-chain thành công!',
      data: {
        certificate_id,
        tx_hash,
        token_id,
        status: 'ISSUED_ON_CHAIN'
      }
    });
  } catch (error) {
    console.error('Lỗi confirmMintCertificate:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// F07-04 & F07-05: Thu hồi chứng chỉ (Revoke)
export async function revokeCertificate(req, res) {
  try {
    const { id } = req.params;
    const { reason, revoke_tx_hash } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do cụ thể khi thu hồi chứng chỉ.'
      });
    }

    const [rows] = await pool.query('SELECT id, certificate_code, status FROM certificates WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Chứng chỉ không tồn tại.' });
    }

    const cert = rows[0];
    if (cert.status === 'REVOKED') {
      return res.status(400).json({ success: false, message: 'Chứng chỉ này đã bị thu hồi trước đó.' });
    }

    await pool.query(`
      UPDATE certificates
      SET status = 'REVOKED', revoke_reason = ?, revoked_at = NOW(), revoked_by = ?, revoke_tx_hash = ?
      WHERE id = ?
    `, [reason, req.user.id, revoke_tx_hash || null, id]);

    // Ghi nhật ký
    await pool.query(`
      INSERT INTO issue_logs (certificate_id, action_by, action, action_detail, note)
      VALUES (?, ?, 'REVOKE', ?, ?)
    `, [
      id, req.user.id,
      `Thu hồi chứng chỉ mã ${cert.certificate_code}`,
      `Lý do: ${reason}`
    ]);

    return res.json({
      success: true,
      message: 'Thu hồi chứng chỉ thành công. Trạng thái đã được ghi nhận bất biến.',
      data: {
        id,
        status: 'REVOKED',
        revoke_reason: reason,
        revoked_at: new Date()
      }
    });
  } catch (error) {
    console.error('Lỗi revokeCertificate:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
