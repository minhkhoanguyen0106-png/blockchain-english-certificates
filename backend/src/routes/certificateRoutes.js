import { Router } from 'express';
import {
  publicVerifyCertificate,
  downloadCertificatePdf,
  getCertificates,
  getCertificateById,
  createDraftCertificate,
  prepareMintCertificate,
  confirmMintCertificate,
  revokeCertificate
} from '../controllers/certificateController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// ==========================================
// PUBLIC ROUTES (PAGE-002 & PAGE-003)
// ==========================================
// Tra cứu theo mã bằng hoặc CCCD hoặc Token ID (F02-01, F02-02, F03-04)
router.get('/public/verify/:code', publicVerifyCertificate);

// Tải phôi PDF công khai (F02-06)
router.get('/public/pdf/:code', downloadCertificatePdf);

// ==========================================
// ADMIN & STAFF ROUTES (PAGE-006 & PAGE-007)
// ==========================================
// Danh sách chứng chỉ có phân trang & lọc (F07-01, F07-02)
router.get('/', verifyToken, getCertificates);

// Chi tiết chứng chỉ
router.get('/:id', verifyToken, getCertificateById);

// Lưu bản nháp chứng chỉ (F06-04)
router.post('/draft', verifyToken, requireRole('ADMIN', 'STAFF'), createDraftCertificate);

// Chuẩn bị đúc SBT & tạo metadata IPFS (F06-05)
router.post('/prepare-mint', verifyToken, requireRole('ADMIN', 'STAFF'), prepareMintCertificate);

// Xác nhận đã đúc on-chain thành công sau khi MetaMask ký (F06-05, F06-06)
router.post('/confirm-mint', verifyToken, requireRole('ADMIN', 'STAFF'), confirmMintCertificate);

// Thu hồi chứng chỉ (F07-04, F07-05)
router.post('/:id/revoke', verifyToken, requireRole('ADMIN'), revokeCertificate);

export default router;
