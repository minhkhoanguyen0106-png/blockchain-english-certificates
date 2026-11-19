# 📜 Contracts Module - Thành viên 1: Blockchain Engineer

> **Đề tài**: Hệ Thống Quản Lý & Xác Thực Chứng Chỉ Trung Tâm Tiếng Anh Bằng Blockchain  
> **Module**: Smart Contract (Solidity), Soulbound Token (SBT), IPFS Storage & Automated Testing  
> **Tác giả phụ trách**: Thành viên 1 (Blockchain Engineer)  
> **Nhánh phát triển**: `tv1/smart-contract-core`, `tv1/test-and-ipfs`, `dev-tv1`

---

## 🌟 1. Tổng Quan Kiến Trúc Smart Contract

Hợp đồng thông minh **`EnglishCertificateNFT.sol`** được xây dựng trên tiêu chuẩn **ERC-721 Non-Transferable (Soulbound Token - SBT)** của OpenZeppelin v5:

```
+-------------------------------------------------------------------------------+
|                       EnglishCertificateNFT (Soulbound Token)                 |
+-------------------------------------------------------------------------------+
| - ERC721URIStorage (OpenZeppelin v5)                                          |
| - AccessControl: DEFAULT_ADMIN_ROLE, ISSUER_ROLE, REVOKER_ROLE                |
| - Ownable (Deployer Management)                                               |
+-------------------------------------------------------------------------------+
|  Core State:                                                                  |
|   * _certificates: tokenId => Certificate struct                              |
|   * _codeToTokenId: certificateCode => tokenId                                |
|   * _hashToTokenId: keccak256(data) => tokenId                                |
|   * _studentCertificates: studentAddress => tokenId[]                         |
|   * authorizedIssuerNames: issuerAddress => organizationName                  |
+-------------------------------------------------------------------------------+
|  Non-Transferability Guard:                                                   |
|   * _update() override: blocks all transfers where (from != 0 && to != 0)     |
+-------------------------------------------------------------------------------+
```

### 1.1. Tính chất Soulbound Token (SBT)
- Chứng chỉ được mint trực tiếp vào địa chỉ ví Web3 của học viên từ địa chỉ `0x0000000000000000000000000000000000000000`.
- Cơ chế ghi đè hàm `_update()`: Mọi hành vi chuyển nhượng (`transferFrom`, `safeTransferFrom`, `approve` + `transfer`) giữa 2 ví khác nhau đều bị chặn hoàn toàn với lỗi `SoulboundTokenCannotBeTransferred()`. Chống triệt để việc mua bán, sang nhượng bằng cấp trái phép.

### 1.2. Phân quyền Role-based Access Control (RBAC)
- **`DEFAULT_ADMIN_ROLE`**: Quản trị viên tối cao của hệ thống trung tâm, có quyền cấp và thu hồi quyền của các cơ sở đào tạo/giảng viên (`registerIssuer`, `revokeIssuer`).
- **`ISSUER_ROLE`**: Cán bộ khảo thí hoặc trung tâm được ủy quyền thực hiện cấp phát chứng chỉ (`issueCertificate`, `batchIssueCertificates`).
- **`REVOKER_ROLE`**: Hội đồng kỷ luật/Ban thanh tra có thẩm quyền thu hồi chứng chỉ khi phát hiện gian lận hoặc sai sót dữ liệu (`revokeCertificate`).

### 1.3. Cấu trúc dữ liệu Certificate Struct
```solidity
struct Certificate {
    uint256 tokenId;           // Mã định danh duy nhất trên Blockchain
    string certificateCode;    // Mã tra cứu hiển thị (VD: CERT-2026-IELTS-001)
    string recipientName;      // Họ và tên học viên (hỗ trợ Unicode tiếng Việt)
    string studentCode;        // Mã số học viên (VD: HV-2026-001)
    address recipientAddress;  // Địa chỉ ví Web3 của học viên
    string courseCode;         // Mã khóa học (IELTS-7.5, TOEIC-850, VSTEP-B2)
    string courseName;         // Tên khóa học đầy đủ
    string score;              // Điểm số / Xếp loại (VD: "7.5 Overall", "850 L&R")
    uint256 issueDate;         // Timestamp ngày cấp chứng chỉ
    uint256 expiryDate;        // Timestamp ngày hết hạn (0 nếu vĩnh viễn)
    string issuerName;         // Tên trung tâm / đơn vị cấp bằng
    address issuerAddress;     // Địa chỉ ví cán bộ ký phát hành
    string ipfsHash;           // CID lưu trữ metadata / hình phôi bằng trên IPFS
    bytes32 certHash;          // Mã băm keccak256 toàn vẹn dữ liệu
    bool isRevoked;            // Trạng thái thu hồi (true nếu bị hủy)
    string revokeReason;       // Lý do thu hồi (nếu có)
}
```

---

## 📋 2. Bảng Tổng Hợp Các Hàm Nghiệp Vụ Cốt Lõi

| Tên Hàm | Quyền gọi | Mô tả chức năng |
| :--- | :---: | :--- |
| `issueCertificate(...)` | `ISSUER_ROLE` | Cấp mới một chứng chỉ tiếng Anh (SBT) cho một học viên. |
| `batchIssueCertificates(...)` | `ISSUER_ROLE` | Cấp chứng chỉ đồng thời cho cả lớp học viên trong 1 giao dịch (tiết kiệm gas ~30%). |
| `revokeCertificate(tokenId, reason)` | `REVOKER_ROLE` | Thu hồi chứng chỉ khi phát hiện gian lận thi cử hoặc sai sót dữ liệu. |
| `verifyCertificate(tokenId)` | Public | Xác thực công khai chứng chỉ theo Token ID (trả về trạng thái, tính hợp lệ, chi tiết). |
| `verifyByCertificateCode(code)` | Public | Xác thực nhanh theo Mã chứng chỉ hiển thị (VD: `ENG-2026-IELTS-001`). |
| `verifyByHash(certHash)` | Public | Xác thực tính toàn vẹn thông qua mã băm SHA-256 nhúng trong mã QR / phôi PDF. |
| `getCertificatesByStudent(address)` | Public | Truy vấn danh sách tất cả Token ID thuộc quyền sở hữu của một học viên. |
| `registerIssuer(address, name)` | `ADMIN_ROLE` | Đăng ký thêm cơ sở / trung tâm / giảng viên được phép cấp chứng chỉ. |
| `revokeIssuer(address)` | `ADMIN_ROLE` | Tước quyền cấp bằng của cơ sở vi phạm. |
| `totalIssued()` | Public | Đếm tổng số lượng chứng chỉ đã cấp phát từ trước đến nay. |
| `getAllTokenIds()` | Public | Trả về mảng danh sách toàn bộ Token ID đã phát hành. |

---

## 📡 3. Bảng Sự Kiện (Smart Contract Events)

Các sự kiện on-chain giúp Backend (`tv2`) và Frontend (`tv3`) lắng nghe Web3 Socket để cập nhật CSDL và hiển thị thông báo thời gian thực:

| Tên Event | Các tham số Indexed | Mục đích sử dụng |
| :--- | :--- | :--- |
| `CertificateIssued` | `uint256 indexed tokenId`, `string indexed certificateCode`, `address indexed recipient` | Phát ra khi cấp bằng thành công; backend cập nhật trạng thái `ISSUED` và lưu `txHash`. |
| `CertificateRevoked` | `uint256 indexed tokenId`, `string indexed certificateCode`, `address indexed revokedBy` | Phát ra khi thu hồi bằng; backend ghi audit log và chuyển trạng thái `REVOKED`. |
| `IssuerRegistered` | `address indexed issuerAddress` | Phát ra khi Admin cấp quyền cho cơ sở/giảng viên mới. |
| `IssuerRevoked` | `address indexed issuerAddress` | Phát ra khi Admin tước quyền cán bộ/cơ sở. |

---

## 📁 4. Cấu Trúc Thư Mục Module `contracts/`

```text
contracts/
├── contracts/
│   └── EnglishCertificateNFT.sol    # Smart contract chính chuẩn Soulbound NFT
├── scripts/
│   ├── deploy.js                    # Script deploy, cấp bằng mẫu & tự động xuất ABI
│   ├── checkRoles.js                # Kiểm tra phân quyền RBAC & số dư ví cán bộ
│   ├── manageRoles.js               # Đăng ký / thu hồi quyền cán bộ cấp bằng
│   ├── ipfsHelper.js                # Tiện ích upload IPFS (Pinata) & tính mã băm SHA-256
│   ├── verifyIpfsUpload.js          # Công cụ kiểm tra metadata IPFS & hash toàn vẹn
│   └── benchmarkGas.js              # Công cụ đo lường tiêu thụ khí Gas thực tế
├── test/
│   ├── EnglishCertificateNFT.test.js # Bộ Unit Test cốt lõi (20 test cases)
│   ├── GasConsumption.test.js       # Kiểm thử khí gas tiêu thụ & cấp bằng hàng loạt
│   └── EdgeCasesAndSecurity.test.js  # Kiểm thử bảo mật, biên giá trị & chống chuyển nhượng
├── artifacts-export/                # Thư mục xuất file ABI + Address phục vụ TV2 và TV3
├── .env.example                     # Mẫu biến môi trường (Private key, RPC, Pinata)
├── hardhat.config.js                # Cấu hình Hardhat đa mạng (Local, Sepolia, Amoy)
├── GAS_REPORT.md                    # Báo cáo phân tích chi phí giao dịch & tối ưu hóa gas
└── package.json                     # Quản lý thư viện và scripts
```

---

## 🚀 5. Hướng Dẫn Cài Đặt & Chạy Kiểm Thử

### Bước 1: Biên dịch Hợp đồng thông minh
```bash
npm run compile
```

### Bước 2: Chạy toàn bộ Unit Tests tự động
```bash
npm run test
# Hoặc chạy kiểm thử phân tách:
npm run test:gas     # Kiểm thử mức tiêu thụ khí Gas
npm run test:edge    # Kiểm thử biên bảo mật và chống tấn công
```

### Bước 3: Kiểm tra phân quyền cán bộ & số dư ví
```bash
npm run roles:check -- --network localhost
# Hoặc trên mạng Sepolia:
npm run roles:check -- --network sepolia
```

### Bước 4: Chạy báo cáo đo lường Gas tiêu thụ
```bash
npm run benchmark:gas
```

### Bước 5: Triển khai Smart Contract
```bash
# Triển khai lên Localhost (yêu cầu npx hardhat node đang chạy):
npm run deploy:local

# Triển khai lên mạng thử nghiệm Ethereum Sepolia:
npm run deploy:sepolia
```
