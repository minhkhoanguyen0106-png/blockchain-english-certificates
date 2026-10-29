# Hệ Thống Quản Lý Chứng Chỉ Trung Tâm Tiếng Anh Bằng Blockchain
*(English Center Certificate Management on Blockchain)*

> Đề tài môn học: **Blockchain & Ứng dụng**  
> Giải pháp cấp phát, lưu trữ và xác thực bằng cấp/chứng chỉ tiếng Anh minh bạch, chống làm giả thông qua hợp đồng thông minh (Smart Contract) và IPFS.

---

## 👥 1. Bảng Phân Công Công Việc & Đánh Giá Đóng Góp

| STT | Họ và Tên | MSSV | Vai trò phụ trách | Module đảm nhiệm | Branch chính phụ trách | Tỷ lệ đóng góp |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: |
| **1** | *(Điền Tên TV1)* | *(Điền MSSV)* | **Blockchain Engineer** | Smart Contract (Solidity), IPFS Storage, Unit Test & Deploy | [`contracts/`](./contracts/) <br>`tv1/smart-contract-core`<br>`tv1/test-and-ipfs` | **33.3%** |
| **2** | *(Điền Tên TV2)* | *(Điền MSSV)* | **Backend Engineer** | RESTful API, Database, Authentication, Tạo PDF & QR Code | [`backend/`](./backend/) <br>`tv2/backend-api-auth`<br>`tv2/pdf-qr-generator` | **33.3%** |
| **3** | *(Điền Tên TV3)* | *(Điền MSSV)* | **Frontend Engineer** | Giao diện Web, Tích hợp MetaMask, Tra cứu & Quét mã QR | [`frontend/`](./frontend/) <br>`tv3/frontend-web3-ui`<br>`tv3/verify-qr-scanner` | **33.3%** |

---

## 📌 2. Chi Tiết Nhiệm Vụ Từng Thành Viên

### 👤 Thành viên 1: Blockchain & Smart Contract
* **Mục tiêu**: Xây dựng nền tảng phi tập trung lưu trữ và xác thực chứng chỉ không thể làm giả.
* **Các công việc cụ thể**:
  - [ ] Thiết kế Smart Contract lưu trữ chứng chỉ: Mã bằng, Tên học sinh, Khóa học (IELTS/TOEIC/VSTEP...), Điểm số, Ngày cấp, Trạng thái (Hợp lệ / Bị thu hồi).
  - [ ] Áp dụng cơ chế **Soulbound Token (SBT)**: Chứng chỉ định danh không thể chuyển nhượng hoặc mua bán.
  - [ ] Viết các hàm nghiệp vụ: `issueCertificate()`, `revokeCertificate()`, `verifyCertificate()`, `getCertificateDetails()`.
  - [ ] Tích hợp dịch vụ **IPFS (Pinata/Web3.Storage)** để lưu trữ metadata và hình ảnh phôi bằng phi tập trung.
  - [ ] Viết Unit Test tự động (Hardhat + Chai) với độ bao phủ test cases cao.
  - [ ] Viết script deploy contract lên Testnet (Polygon Amoy / Ethereum Sepolia / Local node).

### 👤 Thành viên 2: Backend API & Dịch Vụ Chứng Chỉ
* **Mục tiêu**: Xây dựng hệ thống quản lý học viên, khóa học và cầu nối xử lý dữ liệu trước khi đẩy lên Blockchain.
* **Các công việc cụ thể**:
  - [ ] Xây dựng RESTful API (Node.js/Express hoặc Python FastAPI) kết nối CSDL (MongoDB/PostgreSQL).
  - [ ] Xây dựng hệ thống phân quyền (Auth JWT): Admin trung tâm, Cán bộ đào tạo, Học viên.
  - [ ] Module quản lý danh sách học viên, lớp học, điểm thi và yêu cầu cấp chứng chỉ.
  - [ ] Dịch vụ sinh **file PDF chứng chỉ tự động** từ dữ liệu học viên.
  - [ ] Dịch vụ tạo **Mã QR Code** mã hóa link tra cứu hoặc mã băm (Hash/TokenID) nhúng trực tiếp vào file PDF.
  - [ ] Tích hợp thư viện Web3 (`ethers.js`) phía server để đồng bộ và lắng nghe sự kiện từ Smart Contract.

### 👤 Thành viên 3: Frontend & Giao Diện Tra Cứu Công Khai
* **Mục tiêu**: Xây dựng giao diện web trực quan cho cả trung tâm, học viên và người ngoài muốn xác thực bằng cấp.
* **Các công việc cụ thể**:
  - [ ] Xây dựng giao diện web chuẩn responsive (React.js / Next.js hoặc Vue.js).
  - [ ] Tích hợp kết nối ví **MetaMask** cho tài khoản Admin trung tâm ký giao dịch cấp chứng chỉ.
  - [ ] **Admin Dashboard**: Quản lý học viên, duyệt điểm, preview phôi bằng và nút "Cấp bằng lên Blockchain".
  - [ ] **Trang Tra cứu Công khai (Public Verification Page)**:
    - Tra cứu qua mã định danh / Hash chứng chỉ.
    - Quét trực tiếp mã QR qua Camera để kiểm tra chứng chỉ thật hay giả ngay lập tức.
  - [ ] **Portal Học viên**: Giao diện cá nhân để học viên xem và tải chứng chỉ của mình.

---

## 🏗️ 3. Cấu Trúc Dự Án (Monorepo)

```text
blockchain-english-certificates/
├── contracts/                  # [TV1] Khởi tạo Hardhat/Foundry, Smart Contract & Tests
│   ├── contracts/              # Mã nguồn Solidity (*.sol)
│   ├── scripts/                # Script deploy & verify contract
│   └── test/                   # Unit tests cho smart contract
├── backend/                    # [TV2] Server API, Database, PDF & QR generator
│   ├── src/controllers/        # Xử lý logic API
│   ├── src/models/             # Database schema (Học viên, Khóa học, Log cấp bằng)
│   ├── src/services/           # Dịch vụ tạo PDF, mã QR, Web3 connector
│   └── src/routes/             # Định tuyến API
├── frontend/                   # [TV3] Giao diện người dùng Web Application
│   ├── src/components/         # Component UI tái sử dụng
│   ├── src/pages/              # Trang chủ, Dashboard, Tra cứu QR
│   └── src/services/           # Kết nối ví MetaMask, gọi API Backend
├── docs/                       # Tài liệu thiết kế hệ thống, sơ đồ kiến trúc
└── README.md                   # Tài liệu tổng quan đề tài & phân công nhiệm vụ
```

---

## 🌿 4. Quy Chuẩn Làm Việc Với Git & GitHub

### 4.1. Quy ước phân nhánh (Branching Convention)
Mỗi thành viên làm việc độc lập trên branch của mình, tuyệt đối không push thẳng vào `main`:

| Nhánh | Thành viên phụ trách | Mục đích |
| :--- | :--- | :--- |
| `main` | Cả nhóm | Nhánh chính, chỉ merge code đã hoàn thiện và được review |
| `tv1/smart-contract-core` | TV1 | Phát triển Smart Contract & cơ chế SBT |
| `tv1/test-and-ipfs` | TV1 | Viết test case và tích hợp IPFS Pinata |
| `tv2/backend-api-auth` | TV2 | Xây dựng API quản lý, đăng nhập, CSDL |
| `tv2/pdf-qr-generator` | TV2 | Dịch vụ tạo file chứng chỉ PDF & mã QR |
| `tv3/frontend-web3-ui` | TV3 | Xây dựng UI, Dashboard, kết nối MetaMask |
| `tv3/verify-qr-scanner` | TV3 | Trang tra cứu công khai & quét QR xác thực |

### 4.2. Quy ước viết Commit Message (Conventional Commits)
Sử dụng tiền tố rõ ràng để giáo viên đánh giá sự đóng góp:
- `feat(contract): implement issueCertificate and SBT transfer lock`
- `test(contract): add unit tests for revocation logic`
- `feat(backend): implement JWT authentication for admin`
- `feat(backend): generate certificate PDF with embedded QR code`
- `feat(frontend): connect MetaMask wallet and network switcher`
- `feat(frontend): build camera QR code scanner for certificate verification`
- `fix(...)`: Sửa lỗi phát sinh.
- `docs(...)`: Cập nhật tài liệu hoặc README.

### 4.3. Quy trình Merge Code (Pull Request)
1. Sau khi hoàn thành tính năng trên branch cá nhân:
   ```bash
   git add .
   git commit -m "feat(module): mo ta cong viec"
   git push -u origin <ten-branch-cua-ban>
   ```
2. Lên GitHub mở **Pull Request (PR)** vào nhánh `main`.
3. Thành viên khác vào **Review code** và để lại nhận xét trước khi bấm **Merge**.

---

## 🚀 5. Hướng Dẫn Cài Đặt & Chạy Thử Nghiệm
*(Sẽ được cập nhật chi tiết theo tiến độ dự án)*

### Yêu cầu môi trường
- Node.js (>= v18.x)
- Trình duyệt cài đặt tiện ích MetaMask
- Git CLI
