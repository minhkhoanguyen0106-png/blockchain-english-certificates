import { Router } from 'express';
import {
  publicVerifyCertificate,
  publicGetCertificatesByWallet,
  downloadCertificatePdf,
  getCertificates,
  getCertificateById,
  createDraftCertificate,
  prepareMintCertificate,
  confirmMintCertificate,
  revokeCertificate,
  rejectDraftCertificate,
  reconcileCertificate,
  deleteCertificate
} from '../controllers/certificateController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// ==========================================
// PUBLIC ROUTES (PAGE-002 & PAGE-003)
// Hỗ trợ cả 2 định dạng: /public/verify/:code và /verify/:code
// ==========================================
// Tra cứu theo mã bằng hoặc CCCD hoặc Token ID (F02-01, F02-02, F03-04)
router.get('/public/verify/:code', publicVerifyCertificate);
router.get('/verify/:code', publicVerifyCertificate);

// Tra cứu tất cả chứng chỉ thuộc ví học viên (Web3 Student Wallet Lookup - Phương án 1)
router.get('/public/wallet/:address', publicGetCertificatesByWallet);
router.get('/wallet/:address', publicGetCertificatesByWallet);

// Tải / xem phôi PDF công khai (F02-06)
router.get('/public/pdf/:code', downloadCertificatePdf);
router.get('/pdf/:code', downloadCertificatePdf);

// ==========================================
// ADMIN & STAFF ROUTES (PAGE-006 & PAGE-007)
// ==========================================
// Danh sách chứng chỉ có phân trang & lọc (F07-01, F07-02) - Chặn tuyệt đối quyền ngoài nội bộ
router.get('/', verifyToken, requireRole('ADMIN', 'STAFF'), getCertificates);

// Chi tiết chứng chỉ
router.get('/:id', verifyToken, requireRole('ADMIN', 'STAFF'), getCertificateById);

// Lưu bản nháp chứng chỉ (F06-04)
router.post('/draft', verifyToken, requireRole('ADMIN', 'STAFF'), createDraftCertificate);

// Chuẩn bị đúc SBT & tạo metadata IPFS (F06-05) - Chỉ ADMIN ký phát hành (Four-Eyes)
router.post('/prepare-mint', verifyToken, requireRole('ADMIN'), prepareMintCertificate);

// Xác nhận đã đúc on-chain thành công sau khi MetaMask ký (F06-05, F06-06) - Chỉ ADMIN
router.post('/confirm-mint', verifyToken, requireRole('ADMIN'), confirmMintCertificate);

// Từ chối bản nháp chứng chỉ (F06-07) - Chỉ dành cho ADMIN
router.post('/:id/reject', verifyToken, requireRole('ADMIN'), rejectDraftCertificate);

// Đối soát và đồng bộ lại với Smart Contract (F06-08 - Reconciliation)
router.post('/:id/reconcile', verifyToken, requireRole('ADMIN', 'STAFF'), reconcileCertificate);

// Thu hồi chứng chỉ (F07-04, F07-05) - Chỉ ADMIN
router.post('/:id/revoke', verifyToken, requireRole('ADMIN'), revokeCertificate);

// Xóa bản nháp chứng chỉ chưa lên chuỗi (F07-06)
router.delete('/:id', verifyToken, requireRole('ADMIN', 'STAFF'), deleteCertificate);

export default router;
