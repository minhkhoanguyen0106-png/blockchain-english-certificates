import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { SECURITY_CONFIG } from "../src/config/security.config.js";
import * as authController from "../src/controllers/auth.controller.js";
import * as certController from "../src/controllers/certificate.controller.js";
import { authenticateJWT } from "../src/middleware/auth.middleware.js";
import { requireAdmin, requireStaffOrAdmin } from "../src/middleware/rbac.middleware.js";

// Helper tạo mock request & response
const createMockReqRes = ({ headers = {}, body = {}, params = {}, ip = "127.0.0.1", user = null } = {}) => {
  const req = { headers, body, params, ip, user };
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return { req, res };
};

// BỘ KIỂM THỬ BẢO MẬT & PHÂN QUYỀN
async function runSecurityTests() {
  console.log("=====================================================");
  console.log("🔒 CHẠY BỘ KIỂM THỬ BẢO MẬT PHÂN QUYỀN (RBAC & SECURITY)");
  console.log("=====================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(testName, condition, detail = "") {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  // TEST 1: Người chưa đăng nhập gọi API yêu cầu xác thực -> Bắt buộc 401
  {
    const { req, res } = createMockReqRes();
    let nextCalled = false;
    authenticateJWT(req, res, () => { nextCalled = true; });
    assert("Test 1: Chặn người chưa đăng nhập không có Token (HTTP 401)", res.statusCode === 401 && !nextCalled);
  }

  // TEST 2: Token giả mạo hoặc sai chữ ký bí mật -> Bắt buộc 401
  {
    const fakeToken = jwt.sign({ id: 1, role: "ADMIN" }, "WRONG_SECRET_KEY");
    const { req, res } = createMockReqRes({ headers: { authorization: `Bearer ${fakeToken}` } });
    let nextCalled = false;
    authenticateJWT(req, res, () => { nextCalled = true; });
    assert("Test 2: Chặn Token giả mạo sai chữ ký (HTTP 401)", res.statusCode === 401 && res.data.error === "INVALID_TOKEN");
  }

  // TEST 3: Học viên (STUDENT) cố tình truy cập chức năng Cán bộ/Admin -> Bắt buộc 403
  {
    const { req, res } = createMockReqRes({ user: { id: 3, username: "student_yen", role: "STUDENT" } });
    let nextCalled = false;
    requireStaffOrAdmin(req, res, () => { nextCalled = true; });
    assert("Test 3: Học viên (STUDENT) bị từ chối truy cập quyền Cán bộ (HTTP 403)", res.statusCode === 403 && !nextCalled);
  }

  // TEST 4: Cán bộ (STAFF) cố tình gọi API đúc bằng On-Chain (Chỉ Admin) -> Bắt buộc 403
  {
    const { req, res } = createMockReqRes({
      user: { id: 2, username: "staff_long", role: "STAFF" },
      params: { id: "1" }
    });
    certController.mintCertificateOnChain(req, res);
    assert("Test 4: Cán bộ (STAFF) bị chặn không cho phép tự ý Đúc bằng on-chain (HTTP 403)", res.statusCode === 403 && res.data.error === "ADMIN_PRIVILEGE_REQUIRED");
  }

  // TEST 5: Cán bộ (STAFF) cố tình gọi API thu hồi chứng chỉ (Chỉ Admin) -> Bắt buộc 403
  {
    const { req, res } = createMockReqRes({
      user: { id: 2, username: "staff_long", role: "STAFF" },
      params: { id: "1" },
      body: { reason: "Cố tình thu hồi" }
    });
    certController.revokeCertificate(req, res);
    assert("Test 5: Cán bộ (STAFF) bị chặn không cho phép Thu hồi chứng chỉ (HTTP 403)", res.statusCode === 403 && res.data.error === "ADMIN_PRIVILEGE_REQUIRED");
  }

  // TEST 6: Quản trị viên (ADMIN) thực hiện Thu hồi chứng chỉ hợp lệ kèm lý do -> Thành công 200
  {
    const { req, res } = createMockReqRes({
      user: { id: 1, username: "admin_khoa", role: "ADMIN" },
      params: { id: "2" },
      body: { reason: "Kiểm tra phát hiện sai lệch hồ sơ ngày 29/10" }
    });
    certController.revokeCertificate(req, res);
    assert("Test 6: Quản trị viên (ADMIN) thực hiện Thu hồi chứng chỉ thành công (HTTP 200)", res.statusCode === 200 && res.data.certificate.status === "REVOKED");
  }

  // TEST 7: Thu hồi mà KHÔNG cung cấp lý do -> Bắt buộc 400 Validation Error
  {
    const { req, res } = createMockReqRes({
      user: { id: 1, username: "admin_khoa", role: "ADMIN" },
      params: { id: "1" },
      body: { reason: "" } // Trống lý do
    });
    certController.revokeCertificate(req, res);
    assert("Test 7: Bắt buộc cung cấp lý do khi thu hồi chứng chỉ on-chain (HTTP 400)", res.statusCode === 400 && res.data.error === "REASON_REQUIRED");
  }

  // TEST 8: Kiểm soát truy cập dữ liệu (Data Access Control): Học viên chỉ xem được chứng chỉ của mình
  {
    const { req, res } = createMockReqRes({
      user: { id: 3, username: "student_yen", role: "STUDENT" }
    });
    certController.getCertificatesList(req, res);
    assert("Test 8: Cô lập dữ liệu (Data Isolation) - Học viên không thấy danh sách toàn trường", res.statusCode === 200 && res.data.certificates.length <= 1);
  }

  // TEST 9: Khách công khai tra cứu chứng chỉ qua mã -> Thành công 200
  {
    const { req, res } = createMockReqRes({ params: { code: "CERT-IELTS-2026-001" } });
    certController.verifyPublicCertificate(req, res);
    assert("Test 9: Khách vãng lai tra cứu chứng chỉ công khai hợp lệ (HTTP 200)", res.statusCode === 200 && res.data.certificate.student_name === "Nguyễn Thị Minh Khoa");
  }

  // TEST 10: Khách tra cứu mã không tồn tại -> Trả về 404 Not Found rõ ràng
  {
    const { req, res } = createMockReqRes({ params: { code: "CERT-FAKE-999" } });
    certController.verifyPublicCertificate(req, res);
    assert("Test 10: Xử lý an toàn khi tra cứu mã không tồn tại (HTTP 404)", res.statusCode === 404 && res.data.error === "CERTIFICATE_NOT_FOUND");
  }

  // TEST 11: Đăng nhập sai mật khẩu -> Chặn với HTTP 401, không để lộ lỗi cụ thể
  {
    const { req, res } = createMockReqRes({ body: { username: "admin_khoa", password: "wrong_password" } });
    await authController.login(req, res);
    assert("Test 11: Chặn đăng nhập sai mật khẩu an toàn (HTTP 401)", res.statusCode === 401 && res.data.error === "INVALID_CREDENTIALS");
  }

  // TEST 12: Đăng nhập đúng với bcrypt -> Cấp JWT hợp lệ có vai trò chính xác
  {
    const { req, res } = createMockReqRes({ body: { username: "admin_khoa", password: "123456" } });
    await authController.login(req, res);
    const decoded = jwt.verify(res.data.token, SECURITY_CONFIG.JWT_SECRET);
    assert("Test 12: Đăng nhập thành công cấp Token ký bằng bcrypt và JWT (HTTP 200)", res.statusCode === 200 && decoded.role === "ADMIN");
  }

  console.log("\n=====================================================");
  console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passed} PASSED / ${failed} FAILED`);
  console.log("=====================================================\n");

  if (failed > 0) process.exit(1);
}

runSecurityTests();
