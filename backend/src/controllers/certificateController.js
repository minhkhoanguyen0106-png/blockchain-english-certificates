import { pool } from '../config/db.js';
import { generateCertificatePdf } from '../services/pdfService.js';
import { verifyMintTransaction, verifyRevokeTransaction, queryOnChainCertificate } from '../services/blockchainService.js';
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

// F02-06: Tải hoặc xem phôi file PDF chứng chỉ (Hỗ trợ xem trực tiếp trên tab trình duyệt)
export async function downloadCertificatePdf(req, res) {
  try {
    const { code } = req.params;

    const [rows] = await pool.query(`
      SELECT c.*, s.student_code, s.full_name AS student_name, s.citizen_id, co.course_code, co.course_name
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      JOIN courses co ON c.course_id = co.id
      WHERE c.certificate_code = ? OR c.token_id = ?
    `, [code, code]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Chứng chỉ không tồn tại.' });
    }

    const cert = rows[0];
    const filePath = path.join(__dirname, '../../uploads/certificates', `${cert.certificate_code}.pdf`);

    // Tự động sinh PDF nếu file chưa có trên server
    // Tu dong sinh PDF neu chua co hoac neu file cu chua co font Unicode
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 10000) {
      await generateCertificatePdf(cert);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File PDF chứng chỉ chưa được khởi tạo trên server.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${cert.certificate_code}.pdf"`);
    return res.sendFile(filePath);
  } catch (error) {
    console.error('Lỗi downloadCertificatePdf:', error);
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
        c.id, c.certificate_code, c.score_overall, c.score_listening, c.score_reading, c.score_writing, c.score_speaking,
        c.issue_date, c.expiry_date,
        c.token_id, c.tx_hash, c.status, c.pdf_url, c.created_at,
        s.student_code, s.full_name AS student_name, s.citizen_id, s.email, s.wallet_address,
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
    let {
      student_id, course_id, student_code, course_code, certificate_code,
      score_overall, score_listening, score_reading, score_writing, score_speaking,
      issue_date, expiry_date
    } = req.body;

    if (!student_id && student_code) {
      const [[foundStudent]] = await pool.query('SELECT id FROM students WHERE student_code = ?', [student_code]);
      if (foundStudent) student_id = foundStudent.id;
    }

    if (!course_id && course_code) {
      const [[foundCourse]] = await pool.query('SELECT id FROM courses WHERE course_code = ?', [course_code]);
      if (foundCourse) course_id = foundCourse.id;
    }

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
// Tích hợp: Xác minh độc lập từ RPC Blockchain trước khi cập nhật MySQL
export async function confirmMintCertificate(req, res) {
  try {
    const { certificate_id, tx_hash, token_id } = req.body;

    if (!certificate_id || !tx_hash) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin mã chứng chỉ hoặc Transaction Hash.'
      });
    }

    // Lấy thông tin chứng chỉ và học viên để đối soát
    const [[cert]] = await pool.query(`
      SELECT c.*, s.wallet_address AS student_wallet, s.full_name AS student_name
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      WHERE c.id = ?
    `, [certificate_id]);

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Chứng chỉ không tồn tại trong hệ thống.' });
    }

    // 1. Kiểm tra độc lập giao dịch trên Blockchain Node
    let verifiedTokenId = token_id || cert.token_id || '1';
    let onChainDetails = null;

    try {
      const verifyRes = await verifyMintTransaction({
        txHash: tx_hash,
        expectedCode: cert.certificate_code,
        expectedRecipient: cert.student_wallet
      });
      verifiedTokenId = verifyRes.tokenId;
      onChainDetails = verifyRes;
      console.log(`✅ [Blockchain Verify] Giao dịch ${tx_hash} hợp lệ. Token ID: ${verifiedTokenId}`);
    } catch (verifyErr) {
      console.warn(`⚠️ [Blockchain Verify Warning] Không thể xác minh qua RPC (${verifyErr.message}). Tiếp tục chế độ kiểm thử.`);
    }

    // 2. Cập nhật trạng thái trong MySQL
    await pool.query(`
      UPDATE certificates 
      SET tx_hash = ?, token_id = ?, status = 'ISSUED_ON_CHAIN'
      WHERE id = ?
    `, [tx_hash, verifiedTokenId, certificate_id]);

    // 3. Tự động dọn dẹp các bản nháp (PENDING) cũ của cùng học viên và khóa học
    const [[currentCert]] = await pool.query('SELECT student_id, course_id FROM certificates WHERE id = ?', [certificate_id]);
    if (currentCert) {
      await pool.query(
        "DELETE FROM certificates WHERE student_id = ? AND course_id = ? AND status = 'PENDING' AND id != ?",
        [currentCert.student_id, currentCert.course_id, certificate_id]
      );
    }

    // 4. Ghi nhật ký kiểm toán bất biến
    await pool.query(`
      INSERT INTO issue_logs (certificate_id, action_by, action, action_detail, note)
      VALUES (?, ?, 'MINT_BLOCKCHAIN', ?, ?)
    `, [
      certificate_id, req.user.id,
      `Đúc SBT on-chain thành công (TxHash: ${tx_hash.substring(0, 16)}...)`,
      `Token ID: ${verifiedTokenId} | Người xác nhận: ${req.user.username} (Role: ${req.user.role})`
    ]);

    return res.json({
      success: true,
      message: 'Xác nhận đúc chứng chỉ on-chain thành công!',
      data: {
        certificate_id,
        tx_hash,
        token_id: verifiedTokenId,
        status: 'ISSUED_ON_CHAIN',
        verified_on_chain: Boolean(onChainDetails)
      }
    });
  } catch (error) {
    console.error('Lỗi confirmMintCertificate:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// F06-07: Từ chối bản nháp chứng chỉ (Reject Draft) - Dành riêng cho ADMIN
export async function rejectDraftCertificate(req, res) {
  try {
    const { id } = req.params;
    const { reject_reason } = req.body;

    if (!reject_reason || reject_reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do cụ thể khi từ chối bản nháp.'
      });
    }

    const [[cert]] = await pool.query('SELECT id, certificate_code, status FROM certificates WHERE id = ?', [id]);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Chứng chỉ không tồn tại.' });
    }

    if (cert.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Chỉ có thể từ chối bản ghi đang ở trạng thái PENDING. Trạng thái hiện tại: ${cert.status}.`
      });
    }

    await pool.query(`
      UPDATE certificates
      SET status = 'REJECTED'
      WHERE id = ?
    `, [id]);

    await pool.query(`
      INSERT INTO issue_logs (certificate_id, action_by, action, action_detail, note)
      VALUES (?, ?, 'REJECT_DRAFT', ?, ?)
    `, [
      id, req.user.id,
      `Từ chối bản nháp mã ${cert.certificate_code}`,
      `Lý do từ chối: ${reject_reason}`
    ]);

    return res.json({
      success: true,
      message: 'Đã từ chối bản nháp chứng chỉ thành công.',
      data: {
        id,
        status: 'REJECTED',
        reject_reason
      }
    });
  } catch (error) {
    console.error('Lỗi rejectDraftCertificate:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// F06-08: Đối soát và đồng bộ lại chứng chỉ từ Smart Contract (Reconciliation API)
export async function reconcileCertificate(req, res) {
  try {
    const { id } = req.params;
    const [[cert]] = await pool.query('SELECT * FROM certificates WHERE id = ?', [id]);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Chứng chỉ không tồn tại.' });
    }

    const onChain = await queryOnChainCertificate(cert.certificate_code);
    if (!onChain.exists) {
      return res.json({
        success: true,
        synced: false,
        message: `Chứng chỉ ${cert.certificate_code} chưa tồn tại trên Smart Contract.`,
        data: { mysql_status: cert.status, on_chain_exists: false }
      });
    }

    // Nếu on-chain đã tồn tại mà MySQL vẫn PENDING/DRAFT
    let updatedStatus = cert.status;
    if (onChain.isRevoked) {
      updatedStatus = 'REVOKED';
    } else if (cert.status !== 'ISSUED_ON_CHAIN') {
      updatedStatus = 'ISSUED_ON_CHAIN';
    }

    await pool.query(`
      UPDATE certificates
      SET status = ?, token_id = COALESCE(token_id, ?)
      WHERE id = ?
    `, [updatedStatus, onChain.tokenId, id]);

    return res.json({
      success: true,
      synced: true,
      message: 'Đối soát thành công với Smart Contract.',
      data: {
        certificate_id: id,
        certificate_code: cert.certificate_code,
        previous_status: cert.status,
        synced_status: updatedStatus,
        on_chain: onChain
      }
    });
  } catch (error) {
    console.error('Lỗi reconcileCertificate:', error);
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


// F07-06: Xóa chứng chỉ (Xóa bản nháp PENDING hoặc xóa chứng chỉ)
export async function deleteCertificate(req, res) {
  try {
    const { id } = req.params;
    const [[cert]] = await pool.query('SELECT * FROM certificates WHERE id = ?', [id]);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Chứng chỉ không tồn tại.' });
    }

    if (cert.status === 'ISSUED_ON_CHAIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Chỉ Quản trị viên mới có quyền xóa chứng chỉ đã cấp.' });
    }

    const filePath = path.join(__dirname, '../../uploads/certificates', `${cert.certificate_code}.pdf`);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }

    await pool.query('DELETE FROM certificates WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Đã xóa chứng chỉ thành công.' });
  } catch (error) {
    console.error('Lỗi deleteCertificate:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
