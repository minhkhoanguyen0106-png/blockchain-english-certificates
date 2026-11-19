# BẢNG DANH SÁCH TRANG GIAO DIỆN & TÍNH NĂNG CHI TIẾT
*(UI/UX Features & Functional Checklist)*

> **Đề tài**: Hệ Thống Quản Lý Chứng Chỉ Trung Tâm Tiếng Anh Bằng Blockchain  
> **Module phụ trách**: Frontend Engineer & Web3 UI (`dev-tv3`)  
> **Cập nhật ngày**: 29/10/2026  
> **Mục đích**: Bảng đối soát chức năng phục vụ thiết kế giao diện, lập trình Frontend, tích hợp Web3/Backend và nghiệm thu kiểm thử.

---

## 📊 1. BẢNG TỔNG HỢP DANH SÁCH CÁC TRANG (PAGES MATRIX)

| Mã trang | Tên trang giao diện | Đường dẫn (Route) | Đối tượng sử dụng | Quyền hạn (Role) | Độ ưu tiên | Trạng thái |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: |
| **PAGE-001** | Trang Chủ (Landing Page) | `/` | Mọi người truy cập | `PUBLIC` | P1 (Cao) | 🟡 Chờ triển khai |
| **PAGE-002** | Tra Cứu & Xác Thực On-chain | `/verify` | Học viên, Nhà tuyển dụng | `PUBLIC` | P0 (Rất cao) | 🟡 Chờ triển khai |
| **PAGE-003** | Quét Mã QR Bằng Camera | `/scanner` | Mọi người dùng di động/PC | `PUBLIC` | P0 (Rất cao) | 🟡 Chờ triển khai |
| **PAGE-004** | Đăng Nhập Hệ Thống Quản Trị | `/login` | Cán bộ đào tạo, Admin | `GUEST` | P2 (Trung bình) | 🟡 Chờ triển khai |
| **PAGE-005** | Dashboard Tổng Quan | `/admin/dashboard` | Cán bộ, Ban giám hiệu | `STAFF`, `ADMIN` | P2 (Trung bình) | 🟡 Chờ triển khai |
| **PAGE-006** | Cấp Phát Bằng & Đúc Soulbound Token | `/admin/certificates/issue` | Quản trị viên, Cán bộ | `STAFF`, `ADMIN` | P0 (Rất cao) | 🟡 Chờ triển khai |
| **PAGE-007** | Quản Lý Danh Sách & Thu Hồi Bằng | `/admin/certificates` | Quản trị viên, Cán bộ | `STAFF`, `ADMIN` | P0 (Rất cao) | 🟡 Chờ triển khai |
| **PAGE-008** | Quản Lý Học Viên & Khóa Học | `/admin/data-management` | Quản trị viên, Cán bộ | `STAFF`, `ADMIN` | P3 (Thấp) | 🟡 Chờ triển khai |

---

## 📋 2. DANH SÁCH CHỨNG NĂNG CHI TIẾT THEO TỪNG TRANG

---

### 🌐 PAGE-001: TRANG CHỦ (LANDING PAGE)

| Mã chức năng | Tên tính năng | Mô tả chi tiết | Dữ liệu đầu vào (Input) | Kết quả đầu ra (Output) | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **F01-01** | **Hero Section & CTA** | Hiển thị khẩu hiệu, giới thiệu công nghệ Soulbound Token & IPFS, 2 nút bấm điều hướng. | Thao tác click chuột | Chuyển trang sang `/verify` hoặc `/login`. | Nút bấm phản hồi tức thì, mượt mà. |
| **F01-02** | **Thống kê thời gian thực** | Hiển thị các thẻ chỉ số: Tổng số chứng chỉ, Khóa học (IELTS, TOEIC,...), Giao dịch on-chain. | Gọi API `/api/stats/overview` | Hiển thị số liệu dạng bộ đếm (Counter). | Có skeleton loading khi đang tải API. |
| **F01-03** | **Smart Contract Status Badge** | Hiển thị địa chỉ Smart Contract rút gọn và trạng thái mạng (Localhost / Testnet). | Dữ liệu Contract từ Web3 | Badge trạng thái có icon chấm xanh và link mở Block Explorer. | Bấm vào mở đúng địa chỉ trên Etherscan/Polygonscan. |
| **F01-04** | **Quy trình hoạt động (Timeline)** | Hiển thị 4 bước: Thi đạt -> Trung tâm ký duyệt -> Đúc SBT -> Xác thực tức thì. | Giao diện tĩnh | Đồ họa trực quan, dễ hiểu cho người mới. | Hiển thị đẹp trên cả điện thoại và máy tính. |

---

### 🔍 PAGE-002: TRA CỨU & XÁC THỰC ON-CHAIN (PUBLIC VERIFY)

| Mã chức năng | Tên tính năng | Mô tả chi tiết | Dữ liệu đầu vào (Input) | Kết quả đầu ra (Output) | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **F02-01** | **Tìm kiếm chứng chỉ** | Ô nhập mã chứng chỉ hoặc Token ID để tra cứu. | Mã bằng (VD: `CERT-IELTS-2026-001`) | Kích hoạt luồng đối soát dữ liệu. | Hỗ trợ phím Enter và nút bấm tìm kiếm. |
| **F02-02** | **Đối soát On-chain Realtime** | Gọi trực tiếp hàm Smart Contract `verifyCertificate` để xác định thật/giả. | Mã chứng chỉ | Trả về: Hợp lệ (Valid), Bị thu hồi (Revoked), hoặc Không tồn tại. | Không phụ thuộc vào CSDL trung tâm, lấy dữ liệu gốc từ Blockchain. |
| **F02-03** | **Hiển thị bảng điểm chi tiết** | Hiển thị đầy đủ: Họ tên, MSSV, Khóa học, Điểm Overall, Điểm từng kỹ năng (Nghe, Nói, Đọc, Viết), Ngày cấp, Hạn dùng. | Dữ liệu từ Contract + IPFS Metadata | Thẻ chứng chỉ đồ họa sang trọng, rõ ràng. | Dữ liệu hiển thị chính xác theo từng kỹ năng thi. |
| **F02-04** | **Cảnh báo Thu hồi (Revocation)** | Nếu chứng chỉ đã bị trung tâm thu hồi, hiển thị thông báo màu đỏ nổi bật kèm lý do. | Trạng thái `isRevoked = true` từ Contract | Banner cảnh báo đỏ, ẩn nút tải phôi bằng gốc. | Đảm bảo người xem nhận biết ngay tấm bằng không còn giá trị. |
| **F02-05** | **Bằng chứng Blockchain (Proof)** | Hiển thị Transaction Hash, Token ID và liên kết file phôi gốc trên IPFS. | `tx_hash`, `ipfs_hash` | Link dẫn ra Pinata IPFS Gateway và Explorer. | Click mở được ảnh/file PDF phôi bằng trên IPFS. |
| **F02-06** | **Tải phôi bằng PDF** | Nút bấm tải file PDF chứng chỉ chuẩn in ấn có sẵn mã QR xác thực. | URL file PDF từ backend/IPFS | Trình duyệt tải file `.pdf` về máy người dùng. | File mở được, không bị lỗi font tiếng Việt. |

---

### 📷 PAGE-003: QUÉT MÃ QR BẰNG CAMERA (QR SCANNER)

| Mã chức năng | Tên tính năng | Mô tả chi tiết | Dữ liệu đầu vào (Input) | Kết quả đầu ra (Output) | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **F03-01** | **Quét Camera thời gian thực** | Bật camera thiết bị (webcam laptop hoặc camera sau điện thoại) để quét mã QR in trên bằng giấy. | Luồng video từ Camera | Nhận diện chuỗi ký tự chứa URL / Mã bằng. | Quét nhạy dưới 1 giây khi đưa mã vào khung ngắm. |
| **F03-02** | **Hiệu ứng Laser Scanner** | Hiệu ứng vạch quét màu xanh lá di chuyển lên xuống trong khung ngắm tạo cảm giác công nghệ cao. | CSS Animation | Giao diện sinh động, chuyên nghiệp. | Mượt mà 60fps, không gây lag camera. |
| **F03-03** | **Tải ảnh mã QR (Fallback)** | Cho phép người dùng tải lên ảnh chụp mã QR từ thư viện máy nếu camera bị lỗi hoặc bị từ chối quyền. | File ảnh `.png`, `.jpg` | Thư viện giải mã nội dung ảnh chụp. | Đọc được cả ảnh chụp góc nghiêng hoặc hơi mờ. |
| **F03-04** | **Tự động chuyển trang kết quả** | Khi nhận diện mã thành công, phát tín hiệu và tự động chuyển ngay sang `PAGE-002`. | Mã chứng chỉ trích xuất được | Chuyển hướng URL: `/verify?code={mã}`. | Tự động chuyển trong vòng 500ms không cần bấm thêm nút nào. |

---

### 🔐 PAGE-004: ĐĂNG NHẬP QUẢN TRỊ (AUTH LOGIN)

| Mã chức năng | Tên tính năng | Mô tả chi tiết | Dữ liệu đầu vào (Input) | Kết quả đầu ra (Output) | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **F04-01** | **Form đăng nhập nội bộ** | Form nhập tài khoản cán bộ đào tạo hoặc ban quản trị trung tâm. | Username, Password | Gửi request `POST /api/auth/login`. | Có thông báo lỗi rõ nếu sai tên đăng nhập/mật khẩu. |
| **F04-02** | **Lưu phiên làm việc (JWT)** | Lưu token xác thực vào Storage để duy trì trạng thái đăng nhập. | JWT Token từ API | Token được lưu trữ an toàn, gắn vào Header các request sau. | Không bị mất phiên khi F5 tải lại trang. |
| **F04-03** | **Điều hướng phân quyền** | Phân loại quyền truy cập theo `ADMIN` hoặc `STAFF`. | User Role | Chuyển hướng vào trang `/admin/dashboard`. | Không cho phép tài khoản không đủ quyền truy cập URL quản trị. |

---

### 📊 PAGE-005: DASHBOARD TỔNG QUAN (ADMIN DASHBOARD)

| Mã chức năng | Tên tính năng | Mô tả chi tiết | Dữ liệu đầu vào (Input) | Kết quả đầu ra (Output) | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **F05-01** | **Giám sát kết nối Ví Web3** | Kiểm tra ví MetaMask hiện tại có phải là Owner/Issuer của Smart Contract hay không. | Trạng thái ví MetaMask | Hiển thị nhãn "Ví Admin hợp lệ" (Xanh) hoặc "Chưa kết nối ví Admin" (Vàng). | Có nút bấm kết nối ví trực tiếp ngay trên thanh thông báo. |
| **F05-02** | **Thống kê số lượng bằng** | Các thẻ đếm: Đã cấp on-chain (`ISSUED_ON_CHAIN`), Bản nháp (`PENDING`), Bị thu hồi (`REVOKED`). | API `/api/dashboard/stats` | Hiển thị các khối chỉ số trực quan kèm màu sắc nhận diện. | Số liệu đồng bộ với dữ liệu trong cơ sở dữ liệu. |
| **F05-03** | **Biểu đồ phân bố kỳ thi** | Biểu đồ tròn hiển thị tỷ lệ cấp bằng theo chứng chỉ (IELTS, TOEIC, TOEFL, VSTEP). | Dữ liệu thống kê khóa học | Biểu đồ trực quan sinh động. | Có chú giải (Legend) và tooltip khi rê chuột vào. |
| **F05-04** | **Nhật ký thao tác gần đây** | Danh sách 5 hành động gần nhất từ bảng `issue_logs` (Ai vừa cấp bằng, ai vừa thu hồi lúc nào). | API `/api/logs/recent` | Bảng tóm tắt lịch sử thao tác. | Ghi nhận rõ thời gian và ghi chú thao tác. |

---

### 📜 PAGE-006: CẤP PHÁT BẰNG & ĐÚC SBT ON-CHAIN (ISSUE CERTIFICATE)

| Mã chức năng | Tên tính năng | Mô tả chi tiết | Dữ liệu đầu vào (Input) | Kết quả đầu ra (Output) | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **F06-01** | **Chọn học viên & Auto-fill** | Tìm kiếm và chọn học viên có sẵn từ hệ thống; tự động điền Email, Mã HV, Địa chỉ ví. | Nhập tên/mã học viên | Tự động điền các trường hồ sơ liên quan. | Không phải nhập lại thông tin thủ công nhiều lần. |
| **F06-02** | **Nhập điểm theo định dạng kỳ thi** | Hỗ trợ nhập điểm IELTS (thang 9.0), TOEIC (thang 990), VSTEP (Bậc 3-5), kèm điểm từng kỹ năng. | Điểm số các môn | Tính toán điểm Overall hợp lệ theo quy chế thi. | Chặn nhập điểm âm hoặc vượt quá thang điểm tối đa. |
| **F06-03** | **Live Preview phôi chứng chỉ** | Xem trước ngay lập tức phôi chứng chỉ sắc nét bên cột phải khi đang gõ phím bên trái. | Dữ liệu form nhập liệu | Khung chứng chỉ render thời gian thực có tem, logo và mã QR giả lập. | Tốc độ cập nhật tức thì, không bị giật lag. |
| **F06-04** | **Lưu bản nháp (Draft)** | Lưu thông tin vào CSDL với trạng thái `PENDING` (chưa tốn phí gas blockchain). | Bấm nút "Lưu nháp" | Bản ghi được tạo trong CSDL, ghi nhận log `CREATE_DRAFT`. | Dành cho nhân viên tạo trước để Admin duyệt sau. |
| **F06-05** | **Kích hoạt MetaMask ký đúc SBT** | Tạo PDF, đẩy IPFS lấy CID, sau đó mở popup MetaMask gọi hàm `issueCertificate`. | Bấm nút "Ký & Phát hành On-chain" | MetaMask yêu cầu xác nhận giao dịch; nhận `tx_hash` khi thành công. | Hiển thị màn hình chờ (Loading Overlay) rõ ràng từng bước. |
| **F06-06** | **Popup chúc mừng & Xuất link** | Sau khi giao dịch on-chain được đào xong, hiển thị popup chúc mừng có mã TxHash, link IPFS và nút in bằng. | Kết quả trả về từ Blockchain | Modal thông báo thành công rực rỡ kèm hiệu ứng. | Cung cấp link mở thẳng Etherscan và file PDF. |

---

### 🗃️ PAGE-007: DANH SÁCH & THU HỒI CHỨNG CHỈ (MANAGEMENT & REVOKE)

| Mã chức năng | Tên tính năng | Mô tả chi tiết | Dữ liệu đầu vào (Input) | Kết quả đầu ra (Output) | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **F07-01** | **Bảng dữ liệu & Phân trang** | Bảng hiển thị danh sách chứng chỉ đã cấp với đầy đủ cột thông tin, hỗ trợ chọn số dòng/trang. | Danh sách từ API backend | Bảng dữ liệu gọn gàng, có nút chuyển trang. | Tải mượt mà, hỗ trợ sắp xếp theo ngày cấp mới nhất. |
| **F07-02** | **Bộ lọc đa tiêu chí** | Lọc theo Khóa học (IELTS/TOEIC/VSTEP), Trạng thái (`PENDING`, `ISSUED_ON_CHAIN`, `REVOKED`) và khoảng ngày. | Tiêu chí lọc | Bảng dữ liệu tự động lọc theo điều kiện. | Có nút "Xóa bộ lọc" để quay về mặc định. |
| **F07-03** | **Xem trước phôi bằng PDF** | Nút bấm mở Modal xem trực tiếp file chứng chỉ gốc kèm mã QR để kiểm tra trước khi in. | Click nút "Xem PDF" | Popup PDF Viewer hiển thị sắc nét toàn màn hình. | Có nút Tải về máy và nút In trực tiếp (Print). |
| **F07-04** | **Mở Modal Thu Hồi (Revoke Modal)** | Nút bấm thu hồi mở ra popup cảnh báo nghiêm ngặt về tính bất biến trên Blockchain. | Click nút "Thu hồi" | Modal cảnh báo màu đỏ yêu cầu nhập lý do thu hồi. | Bắt buộc phải nhập lý do mới sáng nút ký ví. |
| **F07-05** | **Ký giao dịch Thu hồi trên MetaMask** | Gọi hàm `revokeCertificate(certCode, reason)` trên Smart Contract qua ví Admin. | Xác nhận trên MetaMask | Trạng thái chuyển sang `REVOKED` vĩnh viễn trên chuỗi và CSDL. | Ghi nhận một dòng nhật ký `REVOKE` vào bảng `issue_logs`. |

---

### 👥 PAGE-008: QUẢN LÝ HỌC VIÊN & KHÓA HỌC (DATA MANAGEMENT)

| Mã chức năng | Tên tính năng | Mô tả chi tiết | Dữ liệu đầu vào (Input) | Kết quả đầu ra (Output) | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **F08-01** | **Quản lý danh sách học viên** | Thêm, sửa, xem thông tin học sinh: Mã HV, Họ tên, Email, Ngày sinh, Số điện thoại, Ví MetaMask. | Form thông tin học viên | Lưu vào bảng `students` trong CSDL. | Kiểm tra trùng mã học viên và định dạng email hợp lệ. |
| **F08-02** | **Quản lý danh mục khóa học** | Thêm mới khóa học/kỳ thi: Mã khóa (VD: `IELTS-ACAD`), Tên khóa, Thời lượng, Mô tả kỳ thi. | Form khóa học | Lưu vào bảng `courses` trong CSDL. | Mã khóa học là duy nhất trong toàn hệ thống. |

---

## 🧩 3. DANH SÁCH THÀNH PHẦN DÙNG CHUNG (SHARED COMPONENTS)

| Mã Component | Tên Component | Chức năng chính | Thuộc tính cấu hình (Props) |
| :---: | :--- | :--- | :--- |
| **C-01** | `Navbar` | Thanh điều hướng đầu trang, tích hợp trạng thái đăng nhập và nút bấm Web3. | `isPublic`, `userRole` |
| **C-02** | `WalletButton` | Nút kết nối MetaMask, tự động phát hiện đổi tài khoản và đổi mạng (Network switch). | `targetChainId`, `onAddressChange` |
| **C-03** | `CertificateFrame` | Khung đồ họa phôi bằng tiếng Anh viền cổ điển, tem nổi, chữ ký số và mã QR nhúng. | `certData`, `isPreviewMode` |
| **C-04** | `StatusTag` | Nhãn trạng thái màu sắc: Xanh lá (`ISSUED`), Vàng (`PENDING`), Đỏ (`REVOKED`). | `status`, `variant` |
| **C-05** | `TxLink` | Rút gọn chuỗi băm giao dịch (VD: `0x71a...89b`) kèm icon mở ra Etherscan. | `hash`, `explorerUrl` |
| **C-06** | `ConfirmDialog` | Hộp thoại xác nhận thao tác nguy hiểm (Thu hồi bằng, Xóa học viên). | `isOpen`, `title`, `content`, `onConfirm` |
| **C-07** | `Web3LoadingModal` | Màn hình chờ hiển thị từng bước giao dịch: *Tạo PDF -> Đẩy IPFS -> Chờ MetaMask ký -> Đang đào block*. | `currentStep`, `stepText`, `isWaitingWallet` |

---

## 🎯 4. THỨ TỰ ƯU TIÊN PHÁT TRIỂN & DEMO ĐỀ TÀI

Để đạt điểm số tối đa trong môn học và có sản phẩm demo ấn tượng nhất cho thầy cô:

1. **Tuần 1 (Ưu tiên P0 - Phần cốt lõi Web3)**:
   - Xây dựng Component `WalletButton` kết nối ví MetaMask.
   - Hoàn thiện `PAGE-002` (Tra cứu on-chain trực tiếp từ Smart Contract).
   - Hoàn thiện `PAGE-003` (Bật camera quét mã QR tức thì).
2. **Tuần 2 (Ưu tiên P0 & P1 - Quy trình cấp bằng)**:
   - Hoàn thiện `PAGE-006` (Form cấp bằng + Live Preview + Ký MetaMask mint Soulbound Token).
   - Hoàn thiện `PAGE-007` (Danh sách bằng + Ký MetaMask thu hồi bằng Revoke).
   - Hoàn thiện `PAGE-001` (Trang chủ Landing Page ấn tượng).
3. **Tuần 3 (Ưu tiên P2 & P3 - Quản trị & Hoàn thiện)**:
   - Hoàn thiện `PAGE-004` (Đăng nhập) và `PAGE-005` (Dashboard thống kê).
   - Hoàn thiện `PAGE-008` (Quản lý học viên & khóa học).
   - Kiểm thử kịch bản demo: Cấp bằng -> Quét QR -> Xác thực thành công -> Thử thu hồi -> Quét lại báo Bị thu hồi.
