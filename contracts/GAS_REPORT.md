# ⚡ Báo Cáo Phân Tích Tiêu Thụ Khí Gas & Tối Ưu Chi Phí Giao Dịch
## Smart Contract: `EnglishCertificateNFT.sol` (Soulbound Token)

> **Tác giả**: Thành viên 1 - Blockchain Engineer  
> **Dự án**: Hệ thống quản lý và xác thực chứng chỉ tiếng Anh ứng dụng Blockchain  
> **Mạng thử nghiệm**: Hardhat Local Node & Ethereum Sepolia Testnet  
> **Thời gian đo lường**: Tháng 11/2026  

---

## 📊 1. Bảng Số Liệu Tiêu Thụ Khí Gas Thực Tế

Bảng dưới đây ghi nhận số liệu đo lường trực tiếp từ Hardhat EVM (`GasConsumption.test.js` & `benchmarkGas.js`):

| Nghiệp Vụ Thực Thi | Hàm Contract Gọi | Gas Tiêu Thụ (Gas Units) | Chi phí L1 (15 Gwei, $3,100/ETH) | Chi phí L2/Polygon (0.05 Gwei) |
| :--- | :--- | :---: | :---: | :---: |
| **Triển khai Hợp đồng (Deploy)** | `constructor("Koheni...")` | **3,973,048** | $184.74 | $0.61 |
| **Phân quyền Chi nhánh** | `registerIssuer(address, name)` | **74,336** | $3.45 | $0.01 |
| **Cấp 01 chứng chỉ đơn lẻ** | `issueCertificate(...)` | **618,151** | $28.74 | $0.09 |
| **Cấp hàng loạt 5 chứng chỉ** | `batchIssueCertificates(...)` | **2,437,111** *(TB 487,422/bằng)* | $113.32 *(TB $22.66)* | $0.37 *(TB $0.07)* |
| **Thu hồi chứng chỉ vi phạm** | `revokeCertificate(id, reason)` | **77,585** | $3.60 | $0.01 |
| **Xác minh qua Mã chứng chỉ** | `verifyByCertificateCode(code)` | **0 Gas** *(View Call)* | **Miễn phí ($0.00)** | **Miễn phí ($0.00)** |
| **Xác minh qua Mã băm QR** | `verifyByHash(certHash)` | **0 Gas** *(View Call)* | **Miễn phí ($0.00)** | **Miễn phí ($0.00)** |
| **Truy vấn bằng của học viên** | `getCertificatesByStudent(...)` | **0 Gas** *(View Call)* | **Miễn phí ($0.00)** | **Miễn phí ($0.00)** |

---

## 🔍 2. Phân Tích & Đánh Giá Tối Ưu Hóa (Gas Optimization)

### 2.1. Đánh giá tính hiệu quả của Cấp bằng hàng loạt (Batch Minting)
- Khi cấp phát 01 chứng chỉ đơn lẻ qua hàm `issueCertificate`:
  $$\text{Gas}_{\text{single}} \approx 618,151 \text{ gas}$$
- Khi cấp phát 05 chứng chỉ trong 01 giao dịch qua hàm `batchIssueCertificates`:
  $$\text{Gas}_{\text{batch\_total}} = 2,437,111 \text{ gas} \implies \text{Gas}_{\text{per\_cert}} = 487,422 \text{ gas}$$
- **Mức tiết kiệm**:
  $$\Delta \text{Gas} = 618,151 - 487,422 = 130,729 \text{ gas / chứng chỉ} \quad (\approx 21.1\% \text{ tiết kiệm})$$
- **Nguyên nhân**:
  1. Loại bỏ chi phí cơ bản mở giao dịch Ethereum ($\text{Base Tx Cost} = 21,000 \text{ gas}$) cho $N-1$ giao dịch.
  2. Tái sử dụng ngữ cảnh thực thi (`msg.sender`, xác thực `ISSUER_ROLE`) chỉ 1 lần duy nhất thay vì $N$ lần.

### 2.2. Chi phí Xác minh Công khai Miễn phí (Zero-Gas Verification)
- Tất cả các hàm tra cứu và xác thực (`verifyCertificate`, `verifyByCertificateCode`, `verifyByHash`, `getCertificatesByStudent`) được thiết kế ở mức truy cập `view`.
- Khi người tuyển dụng, cơ quan hoặc học viên tra cứu thông qua cổng thông tin Web (Frontend React) hoặc API công khai (Backend Express), các truy vấn được thực hiện trực tiếp thông qua RPC `eth_call`.
- **Hệ quả**: Chi phí gas bằng **0 ETH / $0.00**, tạo điều kiện tối đa cho việc phổ cập xác thực chứng chỉ không rào cản.

### 2.3. Lựa chọn Mạng triển khai Thực tế (Mainnet vs Layer 2)
- Trên **Ethereum Mainnet**: Chi phí cấp bằng (~$28/bằng) không phù hợp với quy mô trung tâm đào tạo vừa và nhỏ.
- Trên **Polygon PoS / Arbitrum One / Sepolia Testnet**:
  - Phí gas mạng duy trì ở mức 0.01 - 0.05 Gwei.
  - Chi phí thực tế chỉ dao động từ **$0.01 đến $0.08 / một chứng chỉ**.
  - Tốc độ xử lý khối (Block time): 2 giây (Polygon) so với 12 giây (Ethereum).
  - Đây là giải pháp khuyến nghị chính thức cho đề tài.

---

## 🛡️ 3. An Toàn Bảo Mật & Phòng Chống Tấn Công (Security Audit)

1. **Reentrancy Safe**: Hợp đồng không lưu giữ ETH hay tương tác với các token ngoài, áp dụng quy tắc Checks-Effects-Interactions nghiêm ngặt.
2. **Access Control RBAC**: Quyền hạn được phân tách rõ ràng giữa Admin tối cao, Cán bộ cấp bằng và Ban thanh tra thu hồi.
3. **Soulbound Strict Enforcement**: Ghi đè hàm `_update()` của ERC-721 OpenZeppelin v5, chặn mọi nỗ lực chuyển quyền sở hữu bằng cấp giữa các ví học viên.
4. **Collision Resistance**: Khóa chặt 2 bảng ánh xạ độc lập `_codeToTokenId` và `_hashToTokenId`, ngăn chặn hoàn toàn việc cấp trùng mã chứng chỉ hoặc trùng dữ liệu băm.

---
*Báo cáo được biên soạn bởi Thành viên 1 phục vụ bảo vệ đồ án chuyên đề Blockchain.*
