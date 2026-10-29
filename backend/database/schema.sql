-- Database Schema: Hệ Thống Quản Lý Chứng Chỉ Trung Tâm Tiếng Anh
-- CSDL: MySQL (>= 8.0)

CREATE DATABASE IF NOT EXISTS english_cert_blockchain
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE english_cert_blockchain;

-- 1. Bảng users: Tài khoản quản trị & nhân viên
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('ADMIN', 'STAFF', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Bảng students: Thông tin học viên
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(15),
    wallet_address VARCHAR(42) DEFAULT NULL COMMENT 'Địa chỉ ví MetaMask của học viên',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng courses: Khóa học / Kỳ thi (IELTS, TOEIC, TOEFL, VSTEP)
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    duration VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng certificates: Quản lý chứng chỉ cấp cho học viên
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã chứng chỉ hiển thị',
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    score VARCHAR(50) NOT NULL COMMENT 'Điểm thi (VD: 7.5 Overall, 850 L&R)',
    issue_date DATE NOT NULL,
    expiry_date DATE DEFAULT NULL,
    ipfs_hash VARCHAR(255) DEFAULT NULL COMMENT 'CID lưu file phôi bằng/metadata trên IPFS',
    tx_hash VARCHAR(66) DEFAULT NULL COMMENT 'Mã Hash giao dịch trên Blockchain',
    token_id VARCHAR(100) DEFAULT NULL COMMENT 'Token ID trên Smart Contract (SBT)',
    status ENUM('PENDING', 'ISSUED_ON_CHAIN', 'REVOKED') DEFAULT 'PENDING',
    pdf_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cert_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_cert_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 5. Bảng issue_logs: Lịch sử thao tác cấp phát và thu hồi chứng chỉ
CREATE TABLE IF NOT EXISTS issue_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id INT NOT NULL,
    action_by INT NOT NULL,
    action ENUM('CREATE_DRAFT', 'MINT_BLOCKCHAIN', 'REVOKE') NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_cert FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_user FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE CASCADE
);
