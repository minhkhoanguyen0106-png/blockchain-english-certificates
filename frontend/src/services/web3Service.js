import { ethers } from "ethers";
import { INITIAL_CERTIFICATES, INITIAL_STUDENTS, INITIAL_COURSES } from "./mockData";

const STORAGE_KEY_CERTS = "certchain_certificates";
const STORAGE_KEY_LOGS = "certchain_logs";

// Khởi tạo LocalStorage nếu chưa có
export const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEY_CERTS)) {
    localStorage.setItem(STORAGE_KEY_CERTS, JSON.stringify(INITIAL_CERTIFICATES));
  }
};

// 1. Kiểm tra MetaMask có cài đặt không
export const isMetaMaskInstalled = () => {
  return typeof window !== "undefined" && Boolean(window.ethereum);
};

// 2. Kết nối ví MetaMask
export const connectMetaMask = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error("Trình duyệt chưa cài đặt MetaMask. Vui lòng cài đặt tiện ích MetaMask tại metamask.io để tiếp tục!");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = accounts[0];
  const network = await provider.getNetwork();

  // Lấy số dư ETH/MATIC
  const balanceRaw = await provider.getBalance(address);
  const balance = ethers.formatEther(balanceRaw).slice(0, 6);

  return {
    provider,
    signer,
    address,
    chainId: Number(network.chainId),
    balance
  };
};

// 3. Rút gọn địa chỉ ví (VD: 0x1234...5678)
export const shortenAddress = (addr) => {
  if (!addr) return "";
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

// 4. Lấy toàn bộ danh sách chứng chỉ
export const getAllCertificates = () => {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEY_CERTS);
  return raw ? JSON.parse(raw) : INITIAL_CERTIFICATES;
};

// 5. Tra cứu chứng chỉ theo mã (On-chain / Local)
export const getCertificateByCode = async (code) => {
  initStorage();
  const list = getAllCertificates();
  const found = list.find(
    (c) => c.certificate_code.trim().toUpperCase() === code.trim().toUpperCase()
  );
  return found || null;
};

// 6. Cấp chứng chỉ mới (Đúc Soulbound Token on-chain)
export const issueCertificateOnChain = async (certData) => {
  initStorage();
  
  // Tính toán mã băm Keccak256 chuẩn mật mã Ethereum dựa trên nội dung chứng chỉ (Document Merkle Root)
  const canonicalData = JSON.stringify({
    code: certData.certificate_code,
    name: certData.student_name,
    studentCode: certData.student_code,
    score: certData.score,
    date: certData.issue_date
  });
  const dataCommitmentHash = ethers.keccak256(ethers.toUtf8Bytes(canonicalData));

  // Giả lập giao dịch on-chain thành công
  const txHash = ethers.keccak256(ethers.toUtf8Bytes(canonicalData + Date.now().toString()));
  const fakeCid = "Qm" + Array.from({length: 44}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random()*62)]).join("");
  const newId = Date.now();
  const tokenId = (1000 + Math.floor(Math.random() * 9000)).toString();

  const newCertificate = {
    id: newId,
    certificate_code: certData.certificate_code || `CERT-ENG-${newId.toString().slice(-4)}`,
    data_hash: dataCommitmentHash, // Mã băm toàn vẹn dữ liệu chuẩn OpenCerts/Blockcerts
    student_name: certData.student_name,
    student_code: certData.student_code,
    email: certData.email,
    course_name: certData.course_name,
    course_code: certData.course_code,
    score: certData.score,
    listening: certData.listening || "-",
    reading: certData.reading || "-",
    writing: certData.writing || "-",
    speaking: certData.speaking || "-",
    issue_date: certData.issue_date || new Date().toISOString().slice(0, 10),
    expiry_date: certData.expiry_date || null,
    status: "ISSUED_ON_CHAIN",
    wallet_address: certData.wallet_address || "0x0000000000000000000000000000000000000000",
    token_id: tokenId,
    tx_hash: txHash,
    ipfs_hash: fakeCid,
    pdf_url: "#",
    revoked_reason: null,
    revoked_at: null
  };

  const list = getAllCertificates();
  list.unshift(newCertificate);
  localStorage.setItem(STORAGE_KEY_CERTS, JSON.stringify(list));

  return newCertificate;
};

// 7. Thu hồi chứng chỉ (Revoke On-chain)
export const revokeCertificateOnChain = async (certCode, reason) => {
  initStorage();
  const list = getAllCertificates();
  const idx = list.findIndex(
    (c) => c.certificate_code.trim().toUpperCase() === certCode.trim().toUpperCase()
  );

  if (idx === -1) {
    throw new Error("Không tìm thấy chứng chỉ để thu hồi!");
  }

  list[idx].status = "REVOKED";
  list[idx].revoked_reason = reason || "Quyết định thu hồi của hội đồng khảo thí";
  list[idx].revoked_at = new Date().toISOString().slice(0, 10);

  localStorage.setItem(STORAGE_KEY_CERTS, JSON.stringify(list));
  return list[idx];
};

export { INITIAL_STUDENTS, INITIAL_COURSES };
