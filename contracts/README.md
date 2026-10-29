# 📜 Contracts Module - Thành viên 1: Blockchain Engineer

> **Đề tài**: Hệ Thống Quản Lý & Xác Thực Chứng Chỉ Trung Tâm Tiếng Anh Bằng Blockchain  
> **Module**: Smart Contract (Solidity), Soulbound Token (SBT), IPFS Storage & Automated Testing  
> **Tác giả phụ trách**: Thành viên 1 (Blockchain Engineer)  
> **Nhánh phát triển**: `tv1/smart-contract-core`, `tv1/test-and-ipfs`

---

## 🌟 1. Tổng Quan Kiến Trúc Smart Contract

Hợp đồng thông minh **`EnglishCertificateNFT.sol`** được xây dựng trên tiêu chuẩn **ERC-721 Non-Transferable (Soulbound Token - SBT)** của OpenZeppelin v5:

1. **Tính chất Soulbound Token (Định danh không thể chuyển nhượng)**:
   - Chứng chỉ được mint trực tiếp vào ví học viên từ địa chỉ `0x0000000000000000000000000000000000000000`.
   - Cơ chế ghi đè hàm `_update()`: Mọi hành vi chuyển nhượng (`transferFrom`, `safeTransferFrom`) giữa 2 ví khác nhau đều bị chặn hoàn toàn với lỗi `SoulboundTokenCannotBeTransferred()`. Chống hành vi mua bán, sang nhượng bằng cấp trái phép.

2. **Phân quyền Role-based Access Control (RBAC)**:
   - `DEFAULT_ADMIN_ROLE`: Quản trị viên tối cao (Thêm/bớt trung tâm đào tạo liên kết).
   - `ISSUER_ROLE`: Cán bộ khảo thí / Trung tâm được ủy quyền cấp chứng chỉ.
   - `REVOKER_ROLE`: Quyền thu hồi chứng chỉ khi phát hiện gian lận thi cử.

3. **Bảo toàn dữ liệu kép (On-Chain + Off-Chain IPFS)**:
   - **On-Chain**: Lưu trữ các thuộc tính cốt lõi (Mã chứng chỉ, Tên học viên, Mã số học viên, Tên khóa học, Điểm số, Đơn vị cấp, Ngày cấp, Mã băm toàn vẹn `certHash`, Trạng thái thu hồi).
   - **Off-Chain IPFS (Pinata)**: Lưu trữ phôi bằng hình ảnh độ phân giải cao và file JSON metadata chuẩn OpenSea.

---

## 📋 2. Bảng Tổng Hợp Các Hàm Nghiệp Vụ Cốt Lõi

| Tên Hàm | Quyền gọi | Mô tả chức năng |
| :--- | :---: | :--- |
| `issueCertificate(...)` | `ISSUER_ROLE` | Cấp mới một chứng chỉ tiếng Anh (SBT) cho một học viên. |
| `batchIssueCertificates(...)` | `ISSUER_ROLE` | Cấp chứng chỉ đồng thời cho cả lớp học viên trong 1 giao dịch (tiết kiệm gas). |
| `revokeCertificate(...)` | `REVOKER_ROLE` | Thu hồi chứng chỉ khi có phát hiện gian lận / sai sót (kèm lý do). |
| `verifyCertificate(tokenId)` | Public | Xác thực công khai chứng chỉ theo Token ID (trả về trạng thái, tính hợp lệ, thông tin chi tiết). |
| `verifyByCertificateCode(code)` | Public | Xác thực nhanh theo Mã chứng chỉ (VD: `ENG-2026-IELTS-001`). |
| `verifyByHash(certHash)` | Public | Xác thực tính toàn vẹn thông qua mã băm SHA-256 nhúng trong mã QR. |
| `getCertificatesByStudent(address)` | Public | Truy vấn danh sách tất cả bằng cấp thuộc quyền sở hữu của một học viên. |
| `registerIssuer(address, name)` | `ADMIN_ROLE` | Đăng ký thêm cơ sở / trung tâm được phép cấp bằng. |
| `revokeIssuer(address)` | `ADMIN_ROLE` | Tước quyền cấp bằng của cơ sở vi phạm. |

---

## 📁 3. Cấu Trúc Thư Mục Module `contracts/`

```text
contracts/
├── contracts/
│   └── EnglishCertificateNFT.sol    # Smart contract chính chuẩn Soulbound NFT
├── scripts/
│   ├── deploy.js                    # Script deploy, cấp bằng mẫu & tự động xuất ABI
│   └── ipfsHelper.js                # Tiện ích upload IPFS (Pinata) & tính mã băm SHA-256
├── test/
│   └── EnglishCertificateNFT.test.js # Bộ Unit Test tự động bao phủ 100% nghiệp vụ
├── artifacts-export/                # Thư mục xuất file ABI + Address phục vụ TV2 và TV3
├── .env.example                     # Mẫu biến môi trường (Private key, RPC, Pinata)
├── hardhat.config.js                # Cấu hình Hardhat đa mạng (Local, Sepolia, Amoy)
└── package.json                     # Quản lý thư viện và scripts
```

---

## 🚀 4. Hướng Dẫn Cài Đặt & Chạy Thử Nghiệm

### Bước 1: Cài đặt thư viện dependencies
```bash
cd contracts
npm install
```

### Bước 2: Biên dịch Hợp đồng thông minh (Compile)
```bash
npm run compile
```

### Bước 3: Chạy toàn bộ Unit Tests tự động
```bash
npm run test
```
> Toàn bộ các test case về cấp bằng, chặn chuyển nhượng Soulbound, xác minh theo mã code, xác minh theo hash, thu hồi chứng chỉ và phân quyền sẽ được thực thi tự động.

### Bước 4: Khởi động mạng Blockchain cục bộ (Local Node)
Mở một terminal mới và chạy:
```bash
npm run node
```
*Hardhat sẽ khởi tạo mạng blockchain cục bộ tại `http://127.0.0.1:8545` kèm 20 tài khoản ví thử nghiệm có sẵn 10,000 ETH.*

### Bước 5: Triển khai Smart Contract lên mạng cục bộ
Tại terminal gốc:
```bash
npm run deploy:local
```
Script `deploy.js` sẽ tự động:
1. Triển khai hợp đồng `EnglishCertificateNFT`.
2. Tự động cấp 3 chứng chỉ mẫu thực tế (IELTS, TOEIC, VSTEP) cho các ví học viên thử nghiệm.
3. Tự động xuất thông tin địa chỉ contract và file ABI sang:
   - `backend/src/contracts/EnglishCertificateNFT.json` (dành cho TV2 - Backend)
   - `frontend/src/contracts/EnglishCertificateNFT.json` (dành cho TV3 - Frontend)

### Bước 6: Triển khai lên mạng thử nghiệm công khai (Testnet - Tùy chọn)
Tạo file `.env` từ `.env.example` và điền `PRIVATE_KEY`, sau đó:
```bash
# Triển khai Ethereum Sepolia Testnet
npm run deploy:sepolia

# Hoặc triển khai Polygon Amoy Testnet
npm run deploy:amoy
```

---

## 🤝 5. Hướng Dẫn Tích Hợp Cùng Đồng Đội (TV2 & TV3)

Sau khi chạy lệnh `deploy`, file JSON chứa ABI và địa chỉ Smart Contract đã được tự động đồng bộ sang 2 module còn lại:

- **Dành cho TV2 (Backend Engineer)**:
  - Import ABI từ: `backend/src/contracts/EnglishCertificateNFT.json`
  - Dùng `ethers.Contract` để gọi hàm `issueCertificate` khi duyệt cấp bằng hoặc gọi `verifyByCertificateCode` khi tra cứu API.
- **Dành cho TV3 (Frontend Engineer)**:
  - Import ABI từ: `frontend/src/contracts/EnglishCertificateNFT.json`
  - Kết nối ví MetaMask thông qua `ethers.BrowserProvider` để tương tác trực tiếp với Smart Contract.
