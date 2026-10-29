-- ================================================================
-- CƠ SỞ DỮ LIỆU: HỆ THỐNG QUẢN LÝ CHỨNG CHỈ TIẾNG ANH BLOCKCHAIN
-- Khớp 100% với: DANH_SACH_CHUC_NANG_GIAO_DIEN.md
-- CSDL: MySQL (>= 8.0)
-- ================================================================

CREATE DATABASE IF NOT EXISTS english_cert_blockchain
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE english_cert_blockchain;

-- 1. BẢNG users: Quản lý tài khoản quản trị nội bộ (PAGE-004)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF',
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. BẢNG students: Thông tin học viên (Holder) (PAGE-008, F08-01)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Mã học viên (VD: HV2026-001)',
    citizen_id VARCHAR(20) NOT NULL UNIQUE COMMENT 'Số CCCD để tra cứu chứng chỉ',
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(15),
    wallet_address VARCHAR(42) DEFAULT NULL COMMENT 'Địa chỉ ví MetaMask nhận SBT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_citizen_email (citizen_id, email)
);

-- 3. BẢNG courses: Danh mục khóa học / kỳ thi tiếng Anh (PAGE-008, F08-02)
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'VD: IELTS-ACAD, TOEIC-LR, VSTEP-B2',
    course_name VARCHAR(100) NOT NULL COMMENT 'VD: IELTS Academic, TOEIC Listening & Reading',
    score_type ENUM('IELTS', 'TOEIC', 'VSTEP', 'GENERAL') NOT NULL DEFAULT 'IELTS',
    max_score VARCHAR(20) NOT NULL DEFAULT '9.0',
    duration VARCHAR(50) DEFAULT '3 tháng',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. BẢNG certificates: Quản lý chứng chỉ cấp cho học viên (PAGE-006, PAGE-007, PAGE-002)
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã bằng hiển thị (VD: CERT-IELTS-2026-001)',
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    
    -- Chi tiết điểm số (Khớp F02-03, F06-02)
    score_overall VARCHAR(20) NOT NULL COMMENT 'Điểm tổng quát (VD: 7.5, 850, B2)',
    score_listening VARCHAR(20) DEFAULT NULL COMMENT 'Điểm Nghe',
    score_reading VARCHAR(20) DEFAULT NULL COMMENT 'Điểm Đọc',
    score_writing VARCHAR(20) DEFAULT NULL COMMENT 'Điểm Viết',
    score_speaking VARCHAR(20) DEFAULT NULL COMMENT 'Điểm Nói',
    
    -- Ngày cấp & Hiệu lực
    issue_date DATE NOT NULL COMMENT 'Ngày cấp',
    expiry_date DATE DEFAULT NULL COMMENT 'Ngày hết hạn (nếu có)',
    
    -- Bằng chứng Blockchain & IPFS (Khớp F02-05, F06-05)
    token_id VARCHAR(100) DEFAULT NULL COMMENT 'Token ID trên Smart Contract (SBT)',
    tx_hash VARCHAR(66) DEFAULT NULL COMMENT 'Mã Hash giao dịch trên Blockchain',
    ipfs_hash VARCHAR(255) DEFAULT NULL COMMENT 'CID lưu metadata/ảnh phôi bằng trên IPFS',
    ipfs_metadata_url VARCHAR(255) DEFAULT NULL COMMENT 'Link đầy đủ IPFS Gateway',
    pdf_url VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn file PDF có sẵn QR xác thực',
    
    -- Trạng thái chứng chỉ (Khớp F02-02, F02-04, F07-02)
    status ENUM('PENDING', 'ISSUED_ON_CHAIN', 'REVOKED') NOT NULL DEFAULT 'PENDING',
    
    -- Thông tin thu hồi nếu có (Khớp F02-04, F07-04, F07-05)
    revoke_reason TEXT DEFAULT NULL COMMENT 'Lý do thu hồi chứng chỉ',
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    revoked_by INT DEFAULT NULL COMMENT 'Admin/Staff thực hiện thu hồi',
    revoke_tx_hash VARCHAR(66) DEFAULT NULL COMMENT 'TxHash giao dịch thu hồi on-chain',
    
    created_by INT NOT NULL COMMENT 'Cán bộ tạo bản ghi',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_cert_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cert_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cert_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cert_revoker FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_cert_code (certificate_code),
    INDEX idx_status (status),
    INDEX idx_tx_hash (tx_hash)
);

-- 5. BẢNG issue_logs: Nhật ký thao tác kiểm toán & thống kê Dashboard (PAGE-005, F05-04)
CREATE TABLE IF NOT EXISTS issue_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id INT NOT NULL,
    action_by INT NOT NULL,
    action ENUM('CREATE_DRAFT', 'MINT_BLOCKCHAIN', 'REVOKE', 'UPDATE') NOT NULL,
    action_detail VARCHAR(255) DEFAULT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_log_cert FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_user FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_action_time (created_at DESC)
);
