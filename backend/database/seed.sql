-- ================================================================
-- DỮ LIỆU THẬT & MẪU HOÀN CHỈNH (SEED DATA)
-- Khớp 100% với giao diện Frontend & DANH_SACH_CHUC_NANG_GIAO_DIEN.md
-- ================================================================

USE english_cert_blockchain;

-- 1. TÀI KHOẢN HỆ THỐNG (Mật khẩu mặc định: 123456 hoặc admin123)
-- Hash bcrypt của '123456': $2b$10$IC8Jn6vNY9abYUv/ICdqV.2CC1UpttUu.YWPojptJT6c5KBTLIhgq
INSERT INTO users (id, username, password_hash, full_name, email, role, status) VALUES
(1, 'admin_khoa', '$2b$10$IC8Jn6vNY9abYUv/ICdqV.2CC1UpttUu.YWPojptJT6c5KBTLIhgq', 'Nguyễn Thị Minh Khoa (Giám Đốc)', 'minhkhoanguyen0106@gmail.com', 'ADMIN', 'ACTIVE'),
(2, 'admin', '$2b$10$IC8Jn6vNY9abYUv/ICdqV.2CC1UpttUu.YWPojptJT6c5KBTLIhgq', 'Nguyễn Quản Trị', 'admin@englishcenter.edu.vn', 'ADMIN', 'ACTIVE'),
(3, 'staff_long', '$2b$10$IC8Jn6vNY9abYUv/ICdqV.2CC1UpttUu.YWPojptJT6c5KBTLIhgq', 'Trần Bảo Long (Cán Bộ Khảo Thí)', 'baolong.tran@englishcenter.edu.vn', 'STAFF', 'ACTIVE'),
(4, 'staff_lan', '$2b$10$IC8Jn6vNY9abYUv/ICdqV.2CC1UpttUu.YWPojptJT6c5KBTLIhgq', 'Trần Thị Lan (Khảo Thí)', 'lan.tran@englishcenter.edu.vn', 'STAFF', 'ACTIVE'),
(5, 'student_yen', '$2b$10$IC8Jn6vNY9abYUv/ICdqV.2CC1UpttUu.YWPojptJT6c5KBTLIhgq', 'Lê Hoàng Yến (Học Viên IELTS)', 'hoangyen.le@gmail.com', 'STUDENT', 'ACTIVE')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role), password_hash = VALUES(password_hash);

-- 2. DANH MỤC KHÓA HỌC / KỲ THI
INSERT INTO courses (id, course_code, course_name, score_type, max_score, duration, description) VALUES
(1, 'IELTS-ACAD', 'IELTS Academic Master', 'IELTS', '9.0', '4 tháng', 'Chứng chỉ tiếng Anh học thuật quốc tế đánh giá 4 kỹ năng.'),
(2, 'TOEIC-INT', 'TOEIC 4-Skills Intensive', 'TOEIC', '990', '3 tháng', 'Chứng chỉ tiếng Anh giao tiếp quốc tế môi trường làm việc 4 kỹ năng.'),
(3, 'VSTEP-C1', 'VSTEP B2-C1 Chuẩn Đầu Ra', 'VSTEP', '10.0', '3 tháng', 'Kỳ thi đánh giá năng lực tiếng Anh theo Khung 6 bậc Việt Nam (Bậc 5 - C1).'),
(4, 'CAMBRIDGE-CAE', 'Cambridge C1 Advanced (CAE)', 'CAMBRIDGE', '210', '6 tháng', 'Chứng chỉ tiếng Anh nâng cao của Cambridge University Press & Assessment.')
ON DUPLICATE KEY UPDATE course_name = VALUES(course_name), score_type = VALUES(score_type), max_score = VALUES(max_score);

-- 3. DANH SÁCH HỌC VIÊN (HOLDER)
INSERT INTO students (id, student_code, citizen_id, full_name, email, date_of_birth, phone, wallet_address) VALUES
(1, 'HV2026-0106', '079204010601', 'Nguyễn Thị Minh Khoa', 'minhkhoa.student@gmail.com', '2003-01-06', '0901060106', '0x71C84e8B291823eF4512C890123456789ABCDEF0'),
(2, 'HV2026-0088', '079204008802', 'Trần Bảo Long', 'baolong.tran@gmail.com', '2002-08-08', '0902008802', '0x4B291Aa9823ef4512C890123456789abcdef1234'),
(3, 'HV2026-0012', '079204001203', 'Lê Hoàng Yến', 'hoangyen.le@gmail.com', '2003-12-12', '0903001203', '0x82C61Fe1234567890abcdef1234567890abcdef1'),
(4, 'HV2026-0199', '079204019904', 'Phạm Quốc Hưng', 'quochung.pham@gmail.com', '2002-09-19', '0904019904', '0x91F84e8B291823eF4512C890123456789ABCDEF9'),
(5, 'HV2026-0001', '079204001234', 'Lê Hoàng Nam', 'nam.le@gmail.com', '2002-05-15', '0901234567', '0x71C67Ed3484A2A7767577827e770f733827Fcb45'),
(6, 'HV2026-0002', '079204005678', 'Phạm Minh Anh', 'minhanh.pham@gmail.com', '2003-08-20', '0912345678', '0x2546BcD3c84621e976D8185a91A922aE77ECEc30')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), wallet_address = VALUES(wallet_address);

-- 4. DỮ LIỆU CHỨNG CHỈ (Khớp hoàn toàn với bảng hiển thị gần đây trên Frontend)
INSERT INTO certificates (
    id, certificate_code, student_id, course_id, 
    score_overall, score_listening, score_reading, score_writing, score_speaking,
    issue_date, expiry_date, token_id, tx_hash, ipfs_hash, ipfs_metadata_url,
    pdf_url, status, revoke_reason, revoked_at, revoked_by, revoke_tx_hash, created_by
) VALUES
-- [1] CERT-IELTS-2026-001: Nguyễn Thị Minh Khoa - IELTS 8.0 Overall - On-Chain
(1, 'CERT-IELTS-2026-001', 1, 1, 
 '8.0 Overall', '8.5', '8.0', '7.5', '8.0',
 '2026-10-15', '2028-10-15', '1001', 
 '0x3a9f8b72c91823ef4512c890123456789abcdef0123456789abcdef012345678', 
 'QmZtmD2qt8fJv32FNbdZUEbx4epPrq7iCPcNo1XauQBhMx', 
 'https://gateway.pinata.cloud/ipfs/QmZtmD2qt8fJv32FNbdZUEbx4epPrq7iCPcNo1XauQBhMx',
 '/uploads/certificates/CERT-IELTS-2026-001.pdf',
 'ISSUED_ON_CHAIN', NULL, NULL, NULL, NULL, 1),

-- [2] CERT-TOEIC-2026-088: Trần Bảo Long - TOEIC 920/990 - On-Chain
(2, 'CERT-TOEIC-2026-088', 2, 2, 
 '920/990', '475', '445', '180', '175',
 '2026-09-20', '2028-09-20', '1002', 
 '0x89ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcd', 
 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco', 
 'https://gateway.pinata.cloud/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
 '/uploads/certificates/CERT-TOEIC-2026-088.pdf',
 'ISSUED_ON_CHAIN', NULL, NULL, NULL, NULL, 1),

-- [3] CERT-VSTEP-2026-012: Lê Hoàng Yến - VSTEP Bậc 5 (C1) - Revoked
(3, 'CERT-VSTEP-2026-012', 3, 3, 
 'Bậc 5 (C1)', '8.5', '8.0', '7.0', '8.5',
 '2026-08-10', '2028-08-10', '1003', 
 '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 
 'QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbdukVaTe7nTMZao7', 
 'https://gateway.pinata.cloud/ipfs/QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbdukVaTe7nTMZao7',
 '/uploads/certificates/CERT-VSTEP-2026-012.pdf',
 'REVOKED', 'Phát hiện gian lận mang thiết bị thu phát sóng trong phòng thi ngày 10/08', 
 '2026-08-12 14:00:00', 1, '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d', 1),

-- [4] CERT-IELTS-2026-099: Phạm Quốc Hưng - IELTS 7.5 Overall - Bản nháp Pending
(4, 'CERT-IELTS-2026-099', 4, 1, 
 '7.5 Overall', '7.5', '7.5', '7.0', '7.5',
 '2026-10-29', '2028-10-29', NULL, 
 NULL, NULL, NULL,
 NULL, 'PENDING', NULL, NULL, NULL, NULL, 3)
ON DUPLICATE KEY UPDATE 
    score_overall = VALUES(score_overall),
    status = VALUES(status),
    token_id = VALUES(token_id),
    tx_hash = VALUES(tx_hash),
    revoke_reason = VALUES(revoke_reason),
    revoked_at = VALUES(revoked_at);

-- 5. NHẬT KÝ THAO TÁC CẤP BẰNG & ON-CHAIN
INSERT INTO issue_logs (id, certificate_id, action_by, action, action_detail, note, created_at) VALUES
(1, 1, 1, 'CREATE_DRAFT', 'Tạo bản ghi nháp chứng chỉ IELTS', 'Học viên Nguyễn Thị Minh Khoa (HV2026-0106)', '2026-10-15 08:30:00'),
(2, 1, 1, 'MINT_BLOCKCHAIN', 'Ký ví MetaMask đúc Soulbound Token #1001 thành công', 'TxHash: 0x3a9f8b72c91823ef4512c890123456789abcdef0123456789abcdef012345678', '2026-10-15 09:15:00'),
(3, 2, 1, 'MINT_BLOCKCHAIN', 'Ký ví MetaMask đúc Soulbound Token #1002 thành công', 'TxHash: 0x89ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcd', '2026-09-20 10:00:00'),
(4, 3, 1, 'REVOKE', 'Thu hồi chứng chỉ trên Blockchain', 'Lý do: Phát hiện gian lận mang thiết bị thu phát sóng trong phòng thi ngày 10/08', '2026-08-12 14:00:00'),
(5, 4, 3, 'CREATE_DRAFT', 'Soạn thảo bản ghi nháp chứng chỉ IELTS cho Phạm Quốc Hưng', 'Chờ giám đốc ký ví phát hành on-chain', '2026-10-29 16:45:00')
ON DUPLICATE KEY UPDATE action_detail = VALUES(action_detail), note = VALUES(note);
