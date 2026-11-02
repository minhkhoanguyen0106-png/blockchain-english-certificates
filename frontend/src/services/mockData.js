// Dữ liệu mẫu ban đầu để demo mượt mà (Hỗ trợ lưu trữ LocalStorage)

export const INITIAL_CERTIFICATES = [
  {
    id: 1,
    certificate_code: "CERT-IELTS-2026-001",
    student_name: "Nguyễn Thị Minh Khoa",
    student_code: "HV2026-0106",
    email: "minhkhoa.student@gmail.com",
    course_name: "IELTS Academic Master",
    course_code: "IELTS-ACAD",
    score: "8.0 Overall",
    listening: "8.5",
    reading: "8.0",
    writing: "7.5",
    speaking: "8.0",
    issue_date: "2026-10-15",
    expiry_date: "2028-10-15",
    status: "ISSUED_ON_CHAIN", // ISSUED_ON_CHAIN | PENDING | REVOKED
    wallet_address: "0x71C...4e8B",
    token_id: "1001",
    tx_hash: "0x3a9f8b72c91823ef4512c890123456789abcdef0123456789abcdef012345678",
    ipfs_hash: "QmZtmD2qt8fJv32FNbdZUEbx4epPrq7iCPcNo1XauQBhMx",
    pdf_url: "#",
    revoked_reason: null,
    revoked_at: null
  },
  {
    id: 2,
    certificate_code: "CERT-TOEIC-2026-088",
    student_name: "Trần Bảo Long",
    student_code: "HV2026-0088",
    email: "baolong.tran@gmail.com",
    course_name: "TOEIC 4-Skills Intensive",
    course_code: "TOEIC-INT",
    score: "920/990",
    listening: "475",
    reading: "445",
    writing: "180",
    speaking: "175",
    issue_date: "2026-09-20",
    expiry_date: "2028-09-20",
    status: "ISSUED_ON_CHAIN",
    wallet_address: "0x4b2...91Aa",
    token_id: "1002",
    tx_hash: "0x89ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcd",
    ipfs_hash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    pdf_url: "#",
    revoked_reason: null,
    revoked_at: null
  },
  {
    id: 3,
    certificate_code: "CERT-VSTEP-2026-012",
    student_name: "Lê Hoàng Yến",
    student_code: "HV2026-0012",
    email: "hoangyen.le@gmail.com",
    course_name: "VSTEP B2-C1 Chuẩn Đầu Ra",
    course_code: "VSTEP-C1",
    score: "Bậc 5 (C1)",
    listening: "8.5",
    reading: "8.0",
    writing: "7.0",
    speaking: "8.5",
    issue_date: "2026-08-10",
    expiry_date: "2028-08-10",
    status: "REVOKED", // Chứng chỉ bị thu hồi để test kịch bản
    wallet_address: "0x82C...61Fe",
    token_id: "1003",
    tx_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    ipfs_hash: "QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbdukVaTe7nTMZao7",
    pdf_url: "#",
    revoked_reason: "Phát hiện gian lận mang thiết bị thu phát sóng trong phòng thi ngày 10/08",
    revoked_at: "2026-08-12"
  }
];

export const INITIAL_STUDENTS = [
  { id: 1, student_code: "HV2026-0106", full_name: "Nguyễn Thị Minh Khoa", email: "minhkhoa.student@gmail.com", wallet_address: "0x71C84e8B291823eF4512C890123456789ABCDEF0" },
  { id: 2, student_code: "HV2026-0088", full_name: "Trần Bảo Long", email: "baolong.tran@gmail.com", wallet_address: "0x4B291Aa9823ef4512C890123456789abcdef1234" },
  { id: 3, student_code: "HV2026-0012", full_name: "Lê Hoàng Yến", email: "hoangyen.le@gmail.com", wallet_address: "0x82C61Fe1234567890abcdef1234567890abcdef1" },
  { id: 4, student_code: "HV2026-0199", full_name: "Phạm Quốc Hưng", email: "quochung.pham@gmail.com", wallet_address: "0x91F84e8B291823eF4512C890123456789ABCDEF9" }
];

export const INITIAL_COURSES = [
  { id: 1, course_code: "IELTS-ACAD", course_name: "IELTS Academic Master (Mục tiêu 7.5 - 8.5)" },
  { id: 2, course_code: "TOEIC-INT", course_name: "TOEIC 4 Kỹ Năng Đột Phá (Mục tiêu 850+)" },
  { id: 3, course_code: "VSTEP-C1", course_name: "VSTEP Chuẩn Đầu Ra Bậc 5 (C1)" },
  { id: 4, course_code: "CAMBRIDGE-CAE", course_name: "Cambridge C1 Advanced (CAE)" }
];
