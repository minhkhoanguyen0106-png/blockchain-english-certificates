import { ethers } from "ethers";
import contractJson from "../contracts/EnglishCertificateNFT.json";
import { INITIAL_CERTIFICATES, INITIAL_STUDENTS, INITIAL_COURSES } from "./mockData";
import { certificateApi } from "./apiService";

const STORAGE_KEY_CERTS = "certchain_certificates";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || contractJson.address || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const CONTRACT_ABI = contractJson.abi;

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

// 2. Kết nối ví MetaMask (Tự động kết nối ví thật nếu có, hoặc kích hoạt Ví Quản Trị Demo nếu chưa cài tiện ích)
export const connectMetaMask = async () => {
  if (!isMetaMaskInstalled()) {
    console.info("💡 Trình duyệt chưa cài MetaMask. Kích hoạt Ví Quản Trị Mô Phỏng (0xf39F...2266) để kiểm thử mượt mà.");
    return {
      provider: null,
      signer: null,
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      chainId: 31337,
      balance: "100.0",
      isDemo: true
    };
  }

  try {
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
      balance,
      isDemo: false
    };
  } catch (err) {
    if (err.code === 4001) {
      throw new Error("Bạn đã từ chối yêu cầu kết nối ví MetaMask.");
    }
    return {
      provider: null,
      signer: null,
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      chainId: 31337,
      balance: "100.0",
      isDemo: true
    };
  }
};

// 3. Khởi tạo đối tượng Smart Contract
export const getCertificateContract = (signerOrProvider) => {
  if (!signerOrProvider) {
    if (isMetaMaskInstalled()) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    }
    return null;
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
};

// 4. Rút gọn địa chỉ ví (VD: 0x1234...5678)
export const shortenAddress = (addr) => {
  if (!addr) return "";
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

// 5. Lấy toàn bộ danh sách chứng chỉ
export const getAllCertificates = () => {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEY_CERTS);
  return raw ? JSON.parse(raw) : INITIAL_CERTIFICATES;
};

// 6. Tra cứu chứng chỉ theo mã (On-chain & Database kết hợp)
export const getCertificateByCode = async (code) => {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();

  // B1: Gọi Backend API lấy dữ liệu thật từ MySQL
  try {
    const res = await certificateApi.verifyPublic(cleanCode);
    if (res.success && res.data) {
      const d = res.data;
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
  } catch {
    // Backend offline -> tra cứu Smart Contract on-chain hoặc fallback cache
  }

  // B2: Tra cứu on-chain qua Smart Contract nếu có MetaMask
  if (isMetaMaskInstalled()) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = getCertificateContract(provider);
      const onchainResult = await contract.verifyByCertificateCode(cleanCode);
      if (onchainResult && onchainResult.exists) {
        const cert = onchainResult.cert;
        return {
          id: Number(onchainResult.tokenId),
          certificate_code: cert.certificateCode,
          student_name: cert.recipientName,
          student_code: cert.studentCode,
          email: "",
          course_name: cert.courseName,
          course_code: cert.courseCode,
          score: cert.score,
          listening: "-",
          reading: "-",
          writing: "-",
          speaking: "-",
          issue_date: new Date(Number(cert.issueDate) * 1000).toISOString().slice(0, 10),
          expiry_date: Number(cert.expiryDate) > 0 ? new Date(Number(cert.expiryDate) * 1000).toISOString().slice(0, 10) : null,
          status: cert.isRevoked ? "REVOKED" : "ISSUED_ON_CHAIN",
          wallet_address: cert.recipientAddress,
          token_id: onchainResult.tokenId.toString(),
          tx_hash: "0x" + cert.certHash.slice(2),
          ipfs_hash: cert.ipfsHash,
          pdf_url: `http://localhost:5000/api/public/pdf/${cert.certificateCode}`,
          revoked_reason: cert.revokeReason || null,
          revoked_at: null
        };
      }
    } catch (e) {
      console.warn("Tra cứu on-chain fallback:", e.message);
    }
  }

  // B3: Fallback danh sách LocalStorage
  initStorage();
  const list = getAllCertificates();
  return list.find((c) => c.certificate_code.trim().toUpperCase() === cleanCode) || null;
};

// 7. Cấp chứng chỉ mới (Tích hợp: Backend MySQL Draft -> Smart Contract Soulbound -> Backend Confirm)
export const issueCertificateOnChain = async (certData, walletSigner) => {
  if (!walletSigner?.signer) throw new Error("Hãy kết nối MetaMask trước khi phát hành.");
  if (!certData.wallet_address || !ethers.isAddress(certData.wallet_address)) {
    throw new Error("Địa chỉ ví của học viên không hợp lệ.");
  }

  const network = await walletSigner.signer.provider.getNetwork();
  if (contractJson.chainId && Number(network.chainId) !== Number(contractJson.chainId)) {
    throw new Error(`MetaMask đang ở chain ${network.chainId}; hãy chuyển sang chain ${contractJson.chainId} của contract.`);
  }

  const recipientAddress = certData.wallet_address;

  // B1: Tính toán mã băm Keccak256 chuẩn mật mã toàn vẹn dữ liệu
  const canonicalData = JSON.stringify({
    code: certData.certificate_code,
    name: certData.student_name,
    studentCode: certData.student_code,
    score: certData.score,
    date: certData.issue_date
  });
  const dataCommitmentHash = ethers.keccak256(ethers.toUtf8Bytes(canonicalData));

  const pendingRes = await certificateApi.getCertificates({
    limit: 100,
    status: "PENDING",
    search: certData.certificate_code
  });
  const existingDraft = pendingRes?.data?.find(
    (item) => item.certificate_code === certData.certificate_code
  );
  const draftRes = existingDraft
    ? { success: true, data: existingDraft }
    : await certificateApi.createDraft({
        certificate_code: certData.certificate_code,
        student_code: certData.student_code,
        course_code: certData.course_code,
        score_overall: certData.score,
        score_listening: certData.listening || null,
        score_reading: certData.reading || null,
        score_writing: certData.writing || null,
        score_speaking: certData.speaking || null,
        issue_date: certData.issue_date,
        expiry_date: certData.expiry_date || null
      });
  if (!draftRes?.success || !draftRes.data?.id) {
    throw new Error(draftRes?.message || "Không lưu được bản ghi chứng chỉ vào máy chủ.");
  }

  const dbCertId = draftRes.data.id;
  const prepRes = await certificateApi.prepareMint(dbCertId);
  if (!prepRes?.success || !prepRes.data?.ipfs_hash) {
    throw new Error(prepRes?.message || "Không chuẩn bị được metadata phát hành.");
  }
  const ipfsHash = prepRes.data.ipfs_hash;

  const contract = getCertificateContract(walletSigner.signer);
  const expiryTimestamp = certData.expiry_date
    ? Math.floor(new Date(certData.expiry_date).getTime() / 1000)
    : 0;
  const tokenURI = `data:application/json;utf8,${encodeURIComponent(JSON.stringify({
    name: `${certData.course_name} - ${certData.student_name}`,
    code: certData.certificate_code,
    score: certData.score,
    ipfs: ipfsHash
  }))}`;

  const tx = await contract.issueCertificate(
    recipientAddress,
    certData.certificate_code,
    certData.student_name,
    certData.student_code,
    certData.course_code,
    certData.course_name,
    certData.score,
    expiryTimestamp,
    ipfsHash,
    dataCommitmentHash,
    tokenURI
  );
  const receipt = await tx.wait();
  if (receipt?.status !== 1) throw new Error(`Giao dịch phát hành thất bại (${tx.hash}).`);

  const onchainResult = await contract.verifyByCertificateCode(certData.certificate_code);
  if (!onchainResult?.exists) {
    throw new Error(`Giao dịch ${tx.hash} đã được xác nhận nhưng chưa đọc được chứng chỉ từ contract.`);
  }
  const tokenId = onchainResult.tokenId.toString();

  try {
    await certificateApi.confirmMint({
      certificate_id: dbCertId,
      tx_hash: tx.hash,
      token_id: tokenId
    });
  } catch (confirmErr) {
    throw new Error(`Đã phát hành on-chain (Tx: ${tx.hash}) nhưng chưa đồng bộ được MySQL: ${confirmErr.message}`);
  }

  // B5: Cập nhật cache LocalStorage
  const newCertificate = {
    id: dbCertId,
    certificate_code: certData.certificate_code,
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
    wallet_address: recipientAddress,
    token_id: tokenId,
    tx_hash: tx.hash,
    ipfs_hash: ipfsHash,
    pdf_url: `http://localhost:5000/api/public/pdf/${certData.certificate_code}`,
    revoked_reason: null,
    revoked_at: null
  };

  // Khi đã đúc hợp lệ on-chain, tự động dọn bỏ bản nháp (PENDING) cũ của cùng học viên và khóa học
  const list = getAllCertificates().filter(c => !(
    c.status === "PENDING" &&
    (c.student_code === certData.student_code || c.student_name === certData.student_name) &&
    c.course_code === certData.course_code
  ));
  list.unshift(newCertificate);
  localStorage.setItem(STORAGE_KEY_CERTS, JSON.stringify(list));

  return newCertificate;
};

// 8. Thu hồi chứng chỉ (Đồng bộ Smart Contract & MySQL)
export const revokeCertificateOnChain = async (certCode, reason, certId, tokenId, walletSigner) => {
  if (!walletSigner?.signer) throw new Error("Hãy kết nối ví ADMIN trước khi thu hồi.");
  if (!certId || !tokenId) throw new Error("Chứng chỉ thiếu ID hoặc Token ID; không thể thu hồi an toàn.");

  const network = await walletSigner.signer.provider.getNetwork();
  if (contractJson.chainId && Number(network.chainId) !== Number(contractJson.chainId)) {
    throw new Error(`MetaMask đang ở chain ${network.chainId}; hãy chuyển sang chain ${contractJson.chainId} của contract.`);
  }

  const contract = getCertificateContract(walletSigner.signer);
  const tx = await contract.revokeCertificate(tokenId, reason);
  const receipt = await tx.wait();
  if (receipt?.status !== 1) throw new Error(`Giao dịch thu hồi thất bại (${tx.hash}).`);

  try {
    await certificateApi.revokeCertificate(certId, reason);
  } catch (apiErr) {
    throw new Error(`Đã thu hồi on-chain (Tx: ${tx.hash}) nhưng chưa đồng bộ được MySQL: ${apiErr.message}`);
  }

  initStorage();
  const list = getAllCertificates();
  const idx = list.findIndex(
    (c) => c.certificate_code.trim().toUpperCase() === certCode.trim().toUpperCase()
  );

  if (idx !== -1) {
    list[idx].status = "REVOKED";
    list[idx].revoked_reason = reason;
    list[idx].revoked_at = new Date().toISOString().slice(0, 10);
    list[idx].revoke_tx_hash = tx.hash;
    localStorage.setItem(STORAGE_KEY_CERTS, JSON.stringify(list));
    return list[idx];
  }

  return null;
};

export { INITIAL_STUDENTS, INITIAL_COURSES };
