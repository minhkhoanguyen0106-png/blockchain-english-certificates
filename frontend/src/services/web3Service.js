import { ethers } from "ethers";
import { INITIAL_CERTIFICATES, INITIAL_STUDENTS, INITIAL_COURSES } from "./mockData";

const STORAGE_KEY_CERTS = "certchain_certificates";

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

// 4. Lấy toàn bộ danh sách chứng chỉ (Đọc từ cache LocalStorage hoặc MockData)
export const getAllCertificates = () => {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEY_CERTS);
  return raw ? JSON.parse(raw) : INITIAL_CERTIFICATES;
};

// 4b. Đồng bộ danh sách từ CSDL MySQL Backend thật (nếu server đang chạy)
export const syncCertificatesFromBackend = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/certificates?limit=100");
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const mapped = json.data.map(d => ({
          id: d.id,
          certificate_code: d.certificate_code,
          student_name: d.student_name,
          student_code: d.student_code,
          course_name: d.course_name,
          course_code: d.course_code,
          score: d.score_overall,
          issue_date: d.issue_date ? d.issue_date.slice(0, 10) : "",
          expiry_date: d.expiry_date ? d.expiry_date.slice(0, 10) : null,
          status: d.status,
          token_id: d.token_id,
          tx_hash: d.tx_hash,
          pdf_url: `http://localhost:5000/api/public/pdf/${d.certificate_code}`
        }));
        localStorage.setItem(STORAGE_KEY_CERTS, JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch {
    // Backend chưa chạy, tiếp tục dùng cache
  }
  return getAllCertificates();
};

// 5. Tra cứu chứng chỉ theo mã (Ưu tiên Database thật -> fallback LocalStorage)
export const getCertificateByCode = async (code) => {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();

  // Thử tra cứu từ CSDL thật qua API backend
  try {
    const res = await fetch(`http://localhost:5000/api/public/verify/${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        return {
          id: d.id,
          certificate_code: d.certificate_code,
          student_name: d.student_name,
          student_code: d.student_code,
          email: d.student_email || d.email || "",
          citizen_id: d.citizen_id,
          course_name: d.course_name,
          course_code: d.course_code,
          score: d.score_overall,
          listening: d.score_listening || "-",
          reading: d.score_reading || "-",
          writing: d.score_writing || "-",
          speaking: d.score_speaking || "-",
          issue_date: d.issue_date ? d.issue_date.slice(0, 10) : "",
          expiry_date: d.expiry_date ? d.expiry_date.slice(0, 10) : null,
          status: d.status,
          wallet_address: d.student_wallet || "0x71C...4e8B",
          token_id: d.token_id,
          tx_hash: d.tx_hash,
          ipfs_hash: d.ipfs_hash || "QmZtmD2qt8fJv32FNbdZUEbx4epPrq7iCPcNo1XauQBhMx",
          pdf_url: `http://localhost:5000/api/public/pdf/${d.certificate_code}`,
          revoked_reason: d.revoke_reason,
          revoked_at: d.revoked_at ? d.revoked_at.slice(0, 10) : null
        };
      }
    }
  } catch {
    // Backend offline, fallback sang local data
  }

  initStorage();
  const list = getAllCertificates();
  const found = list.find(
    (c) => c.certificate_code.trim().toUpperCase() === cleanCode
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
    data_hash: dataCommitmentHash,
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
    pdf_url: `http://localhost:5000/api/public/pdf/${certData.certificate_code}`,
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
