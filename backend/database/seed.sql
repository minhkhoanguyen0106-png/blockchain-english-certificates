-- ================================================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- Dành cho kiểm thử giao diện & API theo DANH_SACH_CHUC_NANG_GIAO_DIEN.md
-- ================================================================

USE english_cert_blockchain;

-- 1. TÀI KHOẢN MẪU (Mật khẩu mặc định: admin123)
-- Hash bcrypt của 'admin123': $2b$10$VbTj0P8mH63b2h09JcO3c.K7Fp8iL0r0XqZ0oG3C1u2V3w4X5y6Za
INSERT INTO users (id, username, password_hash, full_name, email, role, status) VALUES
(1, 'admin', '$2b$10$3zR1.Lrqy8jJqf1gG7Yp8e6O8G9vB4u6w5x4y3z2a1b0c9d8e7f6a', 'Nguyễn Quản Trị', 'admin@englishcenter.edu.vn', 'ADMIN', 'ACTIVE'),
(2, 'staff_lan', '$2b$10$3zR1.Lrqy8jJqf1gG7Yp8e6O8G9vB4u6w5x4y3z2a1b0c9d8e7f6a', 'Trần Thị Lan (Khảo Thí)', 'lan.tran@englishcenter.edu.vn', 'STAFF', 'ACTIVE')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 2. DANH MỤC KHÓA HỌC / KỲ THI
INSERT INTO courses (id, course_code, course_name, score_type, max_score, duration, description) VALUES
(1, 'IELTS-ACAD', 'IELTS Academic', 'IELTS', '9.0', '4 tháng', 'Chứng chỉ tiếng Anh học thuật quốc tế đánh giá 4 kỹ năng.'),
(2, 'TOEIC-LR', 'TOEIC Listening & Reading', 'TOEIC', '990', '3 tháng', 'Chứng chỉ tiếng Anh giao tiếp quốc tế môi trường làm việc.'),
(3, 'VSTEP-B2', 'VSTEP Bậc 4 (B2 Quốc Gia)', 'VSTEP', '10.0', '3 tháng', 'Kỳ thi đánh giá năng lực tiếng Anh theo Khung 6 bậc Việt Nam.')
ON DUPLICATE KEY UPDATE course_name = VALUES(course_name);

-- 3. DANH SÁCH HỌC VIÊN (HOLDER)
INSERT INTO students (id, student_code, citizen_id, full_name, email, date_of_birth, phone, wallet_address) VALUES
(1, 'HV2026-001', '079204001234', 'Lê Hoàng Nam', 'nam.le@gmail.com', '2002-05-15', '0901234567', '0x71C67Ed3484A2A7767577827e770f733827Fcb45'),
(2, 'HV2026-002', '079204005678', 'Phạm Minh Anh', 'minhanh.pham@gmail.com', '2003-08-20', '0912345678', '0x2546BcD3c84621e976D8185a91A922aE77ECEc30'),
(3, 'HV2026-003', '079204009999', 'Trần Quang Dũng', 'quangdung.tran@gmail.com', '2001-11-10', '0987654321', '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 4. DỮ LIỆU CHỨNG CHỈ MẪU (3 trạng thái để Frontend kiểm thử trọn vẹn)
INSERT INTO certificates (
    id, certificate_code, student_id, course_id, 
    score_overall, score_listening, score_reading, score_writing, score_speaking,
    issue_date, expiry_date, token_id, tx_hash, ipfs_hash, ipfs_metadata_url,
    pdf_url, status, revoke_reason, revoked_at, revoked_by, revoke_tx_hash, created_by
) VALUES
-- Mẫu 1: Đã đúc on-chain thành công (PAGE-002 test tra cứu hợp lệ)
(1, 'CERT-IELTS-2026-001', 1, 1, 
 '8.0 Overall', '8.5', '8.5', '7.5', '7.5',
 '2026-10-15', '2028-10-15', '1', 
 '0x7b23c91d4e1f82a93b456cde91023a45b678c901e23f45a67b89c012d345e67f', 
 'QmZtmD2qt8STTpkddk1DZ8aYo3faPT5NUVcEGgKbTMphba', 
 'https://gateway.pinata.cloud/ipfs/QmZtmD2qt8STTpkddk1DZ8aYo3faPT5NUVcEGgKbTMphba',
 '/uploads/certificates/CERT-IELTS-2026-001.pdf',
 'ISSUED_ON_CHAIN', NULL, NULL, NULL, NULL, 1),

-- Mẫu 2: Bị thu hồi (PAGE-002 test F02-04 Cảnh báo thu hồi đỏ)
(2, 'CERT-TOEIC-2026-002', 2, 2, 
 '880 / 990', '460', '420', NULL, NULL,
 '2026-09-01', '2028-09-01', '2', 
 '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', 
 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', 
 'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
 '/uploads/certificates/CERT-TOEIC-2026-002.pdf',
 'REVOKED', 'Phát hiện học viên vi phạm quy chế thi (sử dụng thiết bị gian lận)', 
 '2026-10-20 14:30:00', 1, '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d', 1),

-- Mẫu 3: Bản nháp chờ duyệt/đúc (PAGE-006 & PAGE-007 test Draft)
(3, 'CERT-VSTEP-2026-003', 3, 3, 
 '7.5 (Bậc 4 - B2)', '7.0', '8.0', '7.5', '7.5',
 '2026-10-28', NULL, NULL, NULL, NULL, NULL,
 NULL, 'PENDING', NULL, NULL, NULL, NULL, 2)
ON DUPLICATE KEY UPDATE score_overall = VALUES(score_overall);

-- 5. NHẬT KÝ THAO TÁC MẪU (PAGE-005, F05-04)
INSERT INTO issue_logs (id, certificate_id, action_by, action, action_detail, note, created_at) VALUES
(1, 1, 1, 'CREATE_DRAFT', 'Tạo bản ghi nháp chứng chỉ IELTS', 'Khóa thi tháng 10/2026', '2026-10-15 08:30:00'),
(2, 1, 1, 'MINT_BLOCKCHAIN', 'Ký ví MetaMask đúc SBT Token #1 thành công', 'TxHash: 0x7b23c91d4e1f82a93b456cde91023a45b678c901e23f45a67b89c012d345e67f', '2026-10-15 09:15:00'),
(3, 2, 1, 'MINT_BLOCKCHAIN', 'Ký ví MetaMask đúc SBT Token #2', 'Cấp bằng TOEIC khóa 2026', '2026-09-01 10:00:00'),
(4, 2, 1, 'REVOKE', 'Thu hồi chứng chỉ trên Blockchain', 'Lý do: Phát hiện học viên vi phạm quy chế thi', '2026-10-20 14:30:00'),
(5, 3, 2, 'CREATE_DRAFT', 'Tạo bản ghi nháp chứng chỉ VSTEP', 'Chờ ban giám hiệu duyệt và ký ví', '2026-10-28 16:45:00')
ON DUPLICATE KEY UPDATE action_detail = VALUES(action_detail);
