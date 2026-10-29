# Backend Module (Thành viên 2 - Backend Engineer)

Thư mục chứa:
- Server RESTful API (Khuyên dùng: Node.js/Express hoặc NestJS)
- Cơ sở dữ liệu: **MySQL** (gợi ý dùng ORM: **Prisma** hoặc **Sequelize**)
- Dịch vụ tạo file PDF chứng chỉ và sinh mã QR xác thực nhúng vào bằng
- Kết nối Ethers.js để đồng bộ và tương tác với Smart Contract

---

## 🗄️ Thiết Kế Cơ Sở Dữ Liệu MySQL Gợi Ý

### 1. Bảng `users` (Quản lý tài khoản & phân quyền)
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `username`: VARCHAR(50) UNIQUE NOT NULL
- `password_hash`: VARCHAR(255) NOT NULL
- `full_name`: VARCHAR(100) NOT NULL
- `role`: ENUM('ADMIN', 'STAFF', 'STUDENT') DEFAULT 'STUDENT'
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 2. Bảng `students` (Hồ sơ học viên - Holder)
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `student_code`: VARCHAR(20) UNIQUE NOT NULL (Mã học viên)
- `citizen_id`: VARCHAR(20) UNIQUE NOT NULL (Số CCCD để tra cứu)
- `full_name`: VARCHAR(100) NOT NULL
- `email`: VARCHAR(100) UNIQUE NOT NULL
- `date_of_birth`: DATE NOT NULL
- `phone`: VARCHAR(15)
- `wallet_address`: VARCHAR(42) (Địa chỉ ví MetaMask của học viên nhận SBT)

### 3. Bảng `courses` (Khóa học / Kỳ thi tiếng Anh)
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `course_code`: VARCHAR(20) UNIQUE NOT NULL (Ví dụ: `IELTS-7.0`, `TOEIC-800`, `VSTEP-B2`)
- `course_name`: VARCHAR(100) NOT NULL
- `duration`: VARCHAR(50)
- `description`: TEXT

### 4. Bảng `certificates` (Bảng trung tâm lưu chứng chỉ)
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `certificate_code`: VARCHAR(50) UNIQUE NOT NULL (Mã chứng chỉ hiển thị trên bằng)
- `student_id`: INT NOT NULL (Khóa ngoại -> `students.id`)
- `course_id`: INT NOT NULL (Khóa ngoại -> `courses.id`)
- `score`: VARCHAR(20) NOT NULL (Ví dụ: "7.5 Overall", "850/990")
- `issue_date`: DATE NOT NULL (Ngày cấp)
- `expiry_date`: DATE (Ngày hết hạn, nếu có)
- `ipfs_hash`: VARCHAR(255) (CID lưu metadata/ảnh trên IPFS)
- `tx_hash`: VARCHAR(66) (Mã Hash giao dịch trên Blockchain khi được mint)
- `token_id`: VARCHAR(100) (Token ID trên Smart Contract)
- `status`: ENUM('PENDING', 'ISSUED_ON_CHAIN', 'REVOKED') DEFAULT 'PENDING'
- `pdf_url`: VARCHAR(255) (Đường dẫn lưu file PDF chứng chỉ)
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 5. Bảng `issue_logs` (Nhật ký thao tác)
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `certificate_id`: INT NOT NULL
- `action_by`: INT NOT NULL (Người thực hiện: Admin/Staff)
- `action`: ENUM('CREATE_DRAFT', 'MINT_BLOCKCHAIN', 'REVOKE') NOT NULL
- `note`: TEXT
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
