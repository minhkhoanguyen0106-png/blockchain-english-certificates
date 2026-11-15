import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const EXPECTED_CHAIN_ID = Number(process.env.CHAIN_ID || 31337);
const CONTRACT_ADDRESS = (process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3').toLowerCase();

const CERT_ABI = [
  'event CertificateIssued(uint256 indexed tokenId, string indexed certificateCode, address indexed recipient, string studentCode, string courseCode, bytes32 certHash, uint256 issueDate)',
  'event CertificateRevoked(uint256 indexed tokenId, string indexed certificateCode, string reason, address indexed revokedBy, uint256 revokeDate)',
  'function verifyByCertificateCode(string certificateCode) view returns (bool exists, uint256 tokenId, string studentName, string studentCode, address recipient, string courseName, string score, uint256 issueDate, uint256 expiryDate, bool isRevoked, string revokeReason, string ipfsHash, bytes32 certHash)',
  'function owner() view returns (address)'
];

const contractInterface = new ethers.Interface(CERT_ABI);

export function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getReadOnlyContract() {
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CERT_ABI, provider);
}

/**
 * Xác minh độc lập giao dịch đúc chứng chỉ On-Chain (Four-Eyes Backend Verification)
 * Không tin tưởng mù quáng vào thông tin do client gửi lên.
 */
export async function verifyMintTransaction({ txHash, expectedCode, expectedRecipient }) {
  if (!txHash || !/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
    throw new Error('Định dạng Transaction Hash không hợp lệ (cần mã băm 64 ký tự hex).');
  }

  const provider = getProvider();
  const network = await provider.getNetwork();

  if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
    throw new Error(`RPC Node đang kết nối sai chain: ${network.chainId} (Kỳ vọng: ${EXPECTED_CHAIN_ID}).`);
  }

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    throw new Error(`Giao dịch ${txHash} chưa được đào vào block hoặc không tìm thấy trên RPC node.`);
  }

  if (receipt.status !== 1) {
    throw new Error(`Giao dịch ${txHash} trên Blockchain bị REVERT (thất bại).`);
  }

  // Kiểm tra địa chỉ hợp đồng nhận giao dịch
  if (receipt.to && receipt.to.toLowerCase() !== CONTRACT_ADDRESS) {
    throw new Error(`Giao dịch được gửi đến hợp đồng ${receipt.to}, không khớp với hợp đồng chứng chỉ ${CONTRACT_ADDRESS}.`);
  }

  // Tìm và phân tích event CertificateIssued trong logs
  let issuedEvent = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== CONTRACT_ADDRESS) continue;
    try {
      const parsed = contractInterface.parseLog(log);
      if (parsed && parsed.name === 'CertificateIssued') {
        issuedEvent = parsed;
        break;
      }
    } catch {
      // Bỏ qua các log không khớp ABI
    }
  }

  if (!issuedEvent) {
    throw new Error(`Giao dịch ${txHash} không phát sinh sự kiện CertificateIssued hợp lệ từ hợp đồng.`);
  }

  const { tokenId, certificateCode, recipient } = issuedEvent.args;

  // Đối chiếu mã chứng chỉ
  if (expectedCode && certificateCode.trim().toUpperCase() !== expectedCode.trim().toUpperCase()) {
    throw new Error(`Mã chứng chỉ trong giao dịch on-chain (${certificateCode}) không khớp với bản ghi cần xác nhận (${expectedCode}).`);
  }

  // Đối chiếu ví người nhận (nếu có)
  if (expectedRecipient && recipient.toLowerCase() !== expectedRecipient.toLowerCase()) {
    throw new Error(`Ví học viên nhận token on-chain (${recipient}) không khớp với hồ sơ học viên (${expectedRecipient}).`);
  }

  return {
    verified: true,
    tokenId: tokenId.toString(),
    certificateCode,
    recipient,
    blockNumber: receipt.blockNumber,
    txHash: receipt.hash,
    issuer: receipt.from
  };
}

/**
 * Xác minh độc lập giao dịch thu hồi chứng chỉ On-Chain
 */
export async function verifyRevokeTransaction({ txHash, expectedCode }) {
  if (!txHash || !/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
    throw new Error('Định dạng Transaction Hash thu hồi không hợp lệ.');
  }

  const provider = getProvider();
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!receipt || receipt.status !== 1) {
    throw new Error(`Giao dịch thu hồi ${txHash} không thành công trên Blockchain.`);
  }

  let revokeEvent = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== CONTRACT_ADDRESS) continue;
    try {
      const parsed = contractInterface.parseLog(log);
      if (parsed && parsed.name === 'CertificateRevoked') {
        revokeEvent = parsed;
        break;
      }
    } catch {
      // bỏ qua
    }
  }

  if (!revokeEvent) {
    throw new Error(`Giao dịch ${txHash} không phát sinh sự kiện CertificateRevoked.`);
  }

  const { tokenId, certificateCode, reason, revokedBy } = revokeEvent.args;

  if (expectedCode && certificateCode.trim().toUpperCase() !== expectedCode.trim().toUpperCase()) {
    throw new Error(`Mã chứng chỉ trong giao dịch thu hồi (${certificateCode}) không khớp với bản ghi (${expectedCode}).`);
  }

  return {
    verified: true,
    tokenId: tokenId.toString(),
    certificateCode,
    reason,
    revokedBy,
    blockNumber: receipt.blockNumber
  };
}

/**
 * Đối soát dữ liệu trực tiếp từ Smart Contract (Reconciliation Engine)
 * Xử lý tình huống giao dịch on-chain đã thành công nhưng MySQL bị mất mạng/chưa kịp cập nhật
 */
export async function queryOnChainCertificate(certificateCode) {
  try {
    const contract = getReadOnlyContract();
    const result = await contract.verifyByCertificateCode(certificateCode);
    return {
      exists: result.exists,
      tokenId: result.tokenId ? result.tokenId.toString() : null,
      studentName: result.studentName,
      studentCode: result.studentCode,
      recipient: result.recipient,
      courseName: result.courseName,
      score: result.score,
      issueDate: Number(result.issueDate),
      expiryDate: Number(result.expiryDate),
      isRevoked: result.isRevoked,
      revokeReason: result.revokeReason,
      ipfsHash: result.ipfsHash,
      certHash: result.certHash
    };
  } catch (error) {
    console.warn(`Lỗi đối soát On-chain cho mã ${certificateCode}:`, error.message);
    return { exists: false, error: error.message };
  }
}
