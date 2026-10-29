import { recordAuditLog, auditLogs } from "../middleware/audit.middleware.js";

// Khởi tạo danh sách chứng chỉ theo schema MySQL
export let CERTIFICATES_DB = [
  {
    id: 1,
    certificate_code: "CERT-IELTS-2026-001",
    student_id: 1,
    student_name: "Nguyễn Thị Minh Khoa",
    student_code: "HV2026-0106",
    course_name: "IELTS Academic Master",
    score: "8.0 Overall",
    listening: "8.5",
    reading: "8.0",
    writing: "7.5",
    speaking: "8.0",
    issue_date: "2026-10-15",
    status: "ISSUED_ON_CHAIN",
    token_id: "1001",
    tx_hash: "0x3a9f8b72c91823ef4512c890123456789abcdef0123456789abcdef012345678",
    ipfs_hash: "QmZtmD2qt8fJv32FNbdZUEbx4epPrq7iCPcNo1XauQBhMx",
    revoked_reason: null
  },
  {
    id: 2,
    certificate_code: "CERT-TOEIC-2026-088",
    student_id: 2,
    student_name: "Trần Bảo Long",
    student_code: "HV2026-0088",
    course_name: "TOEIC 4-Skills Intensive",
    score: "920/990",
    listening: "475",
    reading: "445",
    writing: "180",
    speaking: "175",
    issue_date: "2026-09-20",
    status: "ISSUED_ON_CHAIN",
    token_id: "1002",
    tx_hash: "0x89ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcd",
    ipfs_hash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    revoked_reason: null
  },
  {
    id: 3,
    certificate_code: "CERT-VSTEP-2026-012",
    student_id: 3,
    student_name: "Lê Hoàng Yến",
    student_code: "HV2026-0012",
    course_name: "VSTEP B2-C1 Chuẩn Đầu Ra",
    score: "Bậc 5 (C1)",
    listening: "8.5",
    reading: "8.0",
    writing: "7.0",
    speaking: "8.5",
    issue_date: "2026-08-10",
    status: "REVOKED",
    token_id: "1003",
    tx_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    ipfs_hash: "QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbdukVaTe7nTMZao7",
    revoked_reason: "Phát hiện gian lận mang thiết bị thu phát sóng trong phòng thi"
  }
];

// 1. [PUBLIC] Tra cứu công khai (Bất kỳ ai cũng có thể xem kết quả thẩm định)
export const verifyPublicCertificate = (req, res) => {
  const { code } = req.params;
  const cert = CERTIFICATES_DB.find(
    c => c.certificate_code.trim().toUpperCase() === code.trim().toUpperCase()
  );

  if (!cert) {
    return res.status(404).json({
      success: false,
      error: "CERTIFICATE_NOT_FOUND",
      message: "Không tìm thấy chứng chỉ tương ứng trên hệ thống."
    });
  }

  return res.json({
    success: true,
    certificate: cert
  });
};

// 2. [AUTHENTICATED] Lấy danh sách chứng chỉ với kiểm soát phạm vi dữ liệu (Data Access Control)
export const getCertificatesList = (req, res) => {
  const currentUser = req.user;

  // Nếu là ADMIN hoặc STAFF: Được xem toàn bộ chứng chỉ
  if (currentUser.role === "ADMIN" || currentUser.role === "STAFF") {
    return res.json({
      success: true,
      count: CERTIFICATES_DB.length,
      certificates: CERTIFICATES_DB
    });
  }

  // Nếu là STUDENT: Chỉ được xem chứng chỉ của chính mình (Ngăn chặn IDOR / Data Leakage)
  if (currentUser.role === "STUDENT") {
    const studentCerts = CERTIFICATES_DB.filter(c => c.student_name.includes(currentUser.username) || c.student_id === currentUser.id);
    return res.json({
      success: true,
      count: studentCerts.length,
      certificates: studentCerts
    });
  }

  return res.status(403).json({
    success: false,
    error: "UNAUTHORIZED_DATA_ACCESS",
    message: "Bạn không có quyền truy cập danh sách chứng chỉ này."
  });
};

// 3. [STAFF / ADMIN] Tạo bản nháp chứng chỉ (Draft)
export const createDraftCertificate = (req, res) => {
  const { student_name, student_code, course_name, score, listening, reading, writing, speaking } = req.body;

  if (!student_name || !course_name || !score) {
    return res.status(400).json({
      success: false,
      error: "VALIDATION_FAILED",
      message: "Vui lòng nhập đầy đủ tên học viên, khóa học và điểm số."
    });
  }

  const newId = CERTIFICATES_DB.length + 1;
  const newCert = {
    id: newId,
    certificate_code: `CERT-DRAFT-${newId.toString().padStart(3, "0")}`,
    student_id: 99,
    student_name,
    student_code: student_code || "HV-DRAFT",
    course_name,
    score,
    listening: listening || "-",
    reading: reading || "-",
    writing: writing || "-",
    speaking: speaking || "-",
    issue_date: new Date().toISOString().slice(0, 10),
    status: "PENDING",
    token_id: null,
    tx_hash: null,
    ipfs_hash: null,
    revoked_reason: null
  };

  CERTIFICATES_DB.unshift(newCert);

  recordAuditLog({
    actionBy: req.user,
    action: "CREATE_DRAFT",
    targetId: newCert.id,
    note: `Tạo bản nháp chứng chỉ ${newCert.certificate_code} cho ${student_name}`,
    ip: req.ip
  });

  return res.status(201).json({
    success: true,
    message: "Tạo bản nháp thành công. Chờ Admin phê duyệt đúc On-Chain.",
    certificate: newCert
  });
};

// 4. [ADMIN ONLY] Ký & Đúc chứng chỉ On-Chain (Mint Soulbound Token)
export const mintCertificateOnChain = (req, res) => {
  // Kiểm tra nghiêm ngặt: Chỉ ADMIN mới được thực hiện
  if (req.user.role !== "ADMIN") {
    recordAuditLog({
      actionBy: req.user,
      action: "UNAUTHORIZED_MINT_ATTEMPT",
      note: "Người dùng không phải Admin cố tình gọi API đúc bằng",
      ip: req.ip
    });

    return res.status(403).json({
      success: false,
      error: "ADMIN_PRIVILEGE_REQUIRED",
      message: "Chỉ Quản trị viên (ADMIN) mới có thẩm quyền ký và đúc chứng chỉ lên Blockchain."
    });
  }

  const { id } = req.params;
  const cert = CERTIFICATES_DB.find(c => c.id === Number(id));

  if (!cert) {
    return res.status(404).json({
      success: false,
      error: "CERTIFICATE_NOT_FOUND",
      message: "Không tìm thấy chứng chỉ để đúc on-chain."
    });
  }

  // Sinh các giá trị Blockchain chuẩn mực
  cert.status = "ISSUED_ON_CHAIN";
  cert.token_id = (2000 + cert.id).toString();
  cert.tx_hash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join("");
  cert.ipfs_hash = "Qm" + Array.from({length: 44}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random()*62)]).join("");

  recordAuditLog({
    actionBy: req.user,
    action: "MINT_BLOCKCHAIN",
    targetId: cert.id,
    note: `Đúc thành công chứng chỉ ${cert.certificate_code} với Token ID #${cert.token_id}`,
    ip: req.ip
  });

  return res.json({
    success: true,
    message: "Đúc chứng chỉ on-chain thành công!",
    certificate: cert
  });
};

// 5. [ADMIN ONLY] Thu hồi chứng chỉ (Revoke On-Chain)
export const revokeCertificate = (req, res) => {
  if (req.user.role !== "ADMIN") {
    recordAuditLog({
      actionBy: req.user,
      action: "UNAUTHORIZED_REVOKE_ATTEMPT",
      note: "Người dùng không phải Admin cố tình gọi API thu hồi bằng",
      ip: req.ip
    });

    return res.status(403).json({
      success: false,
      error: "ADMIN_PRIVILEGE_REQUIRED",
      message: "Chỉ Quản trị viên (ADMIN) mới có thẩm quyền thu hồi chứng chỉ trên Blockchain."
    });
  }

  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({
      success: false,
      error: "REASON_REQUIRED",
      message: "Bắt buộc phải cung cấp lý do thu hồi chứng chỉ."
    });
  }

  const cert = CERTIFICATES_DB.find(c => c.id === Number(id));

  if (!cert) {
    return res.status(404).json({
      success: false,
      error: "CERTIFICATE_NOT_FOUND",
      message: "Không tìm thấy chứng chỉ để thu hồi."
    });
  }

  if (cert.status === "REVOKED") {
    return res.status(400).json({
      success: false,
      error: "ALREADY_REVOKED",
      message: "Chứng chỉ này đã bị thu hồi trước đó."
    });
  }

  cert.status = "REVOKED";
  cert.revoked_reason = reason.trim();

  recordAuditLog({
    actionBy: req.user,
    action: "REVOKE",
    targetId: cert.id,
    note: `Thu hồi chứng chỉ ${cert.certificate_code}. Lý do: ${reason.trim()}`,
    ip: req.ip
  });

  return res.json({
    success: true,
    message: "Thu hồi chứng chỉ thành công trên Blockchain.",
    certificate: cert
  });
};

// 6. [ADMIN ONLY] Xem toàn bộ nhật ký kiểm toán (Audit Logs)
export const getAuditLogs = (req, res) => {
  return res.json({
    success: true,
    total_logs: auditLogs.length,
    logs: auditLogs
  });
};
