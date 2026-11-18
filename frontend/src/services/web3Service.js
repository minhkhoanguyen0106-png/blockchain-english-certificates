import { ethers } from "ethers";
import contractJson from "../contracts/EnglishCertificateNFT.json";
import { INITIAL_CERTIFICATES, INITIAL_STUDENTS, INITIAL_COURSES } from "./mockData";
import { certificateApi } from "./apiService";

const STORAGE_KEY_CERTS = "certchain_certificates";

export const LOCALHOST_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const SEPOLIA_CONTRACT_ADDRESS = "0x3E7873866c44bD4212d092747D1D2E16b575b651";

// Kiểm tra chainId có thuộc mạng được hỗ trợ (Hardhat Localhost hoặc Sepolia Testnet)
export const isSupportedChain = (chainId) => {
  const id = Number(chainId);
  return id === 31337 || id === 1337 || id === 11155111;
};

// Lấy địa chỉ Smart Contract phù hợp theo Chain ID thực tế của ví
export const getTargetContractAddress = (chainId) => {
  if (import.meta.env.VITE_CONTRACT_ADDRESS) {
    return import.meta.env.VITE_CONTRACT_ADDRESS;
  }
  const id = Number(chainId);
  if (id === 31337 || id === 1337) {
    return LOCALHOST_CONTRACT_ADDRESS;
  }
  if (id === 11155111) {
    return SEPOLIA_CONTRACT_ADDRESS;
  }
  return contractJson.address || LOCALHOST_CONTRACT_ADDRESS;
};

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || contractJson.address || LOCALHOST_CONTRACT_ADDRESS;
export const CONTRACT_ABI = contractJson.abi;
const READONLY_RPC_URL = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

const maskCitizenId = (cid) => {
  if (!cid) return null;
  const s = String(cid).trim();
  if (s.length <= 6) return "***";
  return `${s.slice(0, 3)}${"*".repeat(Math.max(3, s.length - 6))}${s.slice(-3)}`;
};

const getReadOnlyContract = () => {
  try {
    const provider = new ethers.JsonRpcProvider(READONLY_RPC_URL);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  } catch {
    if (isMetaMaskInstalled()) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    }
    return null;
  }
};

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

// 6. Tra cứu chứng chỉ theo mã (Kết hợp Backend API + Đối soát trực tiếp Smart Contract chống TAMPERED)
export const getCertificateByCode = async (code) => {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();

  let dbCert = null;

  // B1: Gọi Backend API lấy dữ liệu chi tiết từ MySQL
  try {
    const res = await certificateApi.verifyPublic(cleanCode);
    if (res.success && res.data) {
      const d = res.data;
      dbCert = {
        id: d.id,
        certificate_code: d.certificate_code,
        student_name: d.student_name,
        student_code: d.student_code,
        email: d.student_email || d.email || "",
        citizen_id: maskCitizenId(d.citizen_id),
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
        revoke_tx_hash: d.revoke_tx_hash || null,
        ipfs_hash: d.ipfs_hash || null,
        pdf_url: `http://localhost:5000/api/public/pdf/${d.certificate_code}`,
        revoked_reason: d.revoke_reason,
        revoked_at: d.revoked_at ? d.revoked_at.slice(0, 10) : null,
        onchain_verified: Boolean(d.onchain_verified),
        tamper_details: d.tamper_details || null,
        blockchain_proof: d.blockchain_proof || null
      };
    }
  } catch {
    // Backend offline hoặc không có trong MySQL -> kiểm tra trực tiếp Smart Contract
  }

  // B2: Đối soát trực tiếp On-chain qua Smart Contract (Không cần MetaMask, dùng Read-Only RPC)
  try {
    const contract = getReadOnlyContract();
    if (contract) {
      const lookupCode = dbCert?.certificate_code || cleanCode;
      const onchainResult = await contract.verifyByCertificateCode(lookupCode);
      if (onchainResult && onchainResult.exists) {
        const cert = onchainResult.cert;

        if (dbCert) {
          dbCert.onchain_verified = true;
          const mismatches = [];
          if (String(cert.recipientName || "").trim() !== String(dbCert.student_name || "").trim()) {
            mismatches.push(`Tên học viên (CSDL: "${dbCert.student_name}" ≠ Sổ cái: "${cert.recipientName}")`);
          }
          if (String(cert.score || "").trim() !== String(dbCert.score || "").trim()) {
            mismatches.push(`Điểm số (CSDL: "${dbCert.score}" ≠ Sổ cái: "${cert.score}")`);
          }
          if (String(cert.studentCode || "").trim() !== String(dbCert.student_code || "").trim()) {
            mismatches.push(`Mã học viên (CSDL: "${dbCert.student_code}" ≠ Sổ cái: "${cert.studentCode}")`);
          }
          if (String(cert.courseCode || "").trim() !== String(dbCert.course_code || "").trim()) {
            mismatches.push(`Mã khóa học (CSDL: "${dbCert.course_code}" ≠ Sổ cái: "${cert.courseCode}")`);
          }

          if (mismatches.length > 0) {
            dbCert.status = "TAMPERED";
            dbCert.tamper_details = mismatches.join("; ");
          } else if (cert.isRevoked && dbCert.status !== "REVOKED") {
            dbCert.status = "REVOKED";
            dbCert.revoked_reason = cert.revokeReason || dbCert.revoked_reason || "Đã bị thu hồi trên Blockchain";
          }
          return dbCert;
        }

        // Không có trong MySQL nhưng tồn tại trực tiếp trên Smart Contract
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
          revoked_at: null,
          onchain_verified: true
        };
      }
    }
  } catch (e) {
    console.warn("Tra cứu on-chain fallback:", e.message);
  }

  if (dbCert) return dbCert;

  // B3: Fallback danh sách LocalStorage
  initStorage();
  const list = getAllCertificates();
  return list.find((c) => c.certificate_code.trim().toUpperCase() === cleanCode) || null;
};

// Tự động chuyển mạng MetaMask sang đúng chainId của Smart Contract nếu mạng không hỗ trợ
export const ensureCorrectNetwork = async (walletSigner) => {
  if (!walletSigner?.signer?.provider) return;
  let network = await walletSigner.signer.provider.getNetwork();
  const currentChainId = Number(network.chainId);

  // Nếu mạng hiện tại là một trong các mạng hỗ trợ (Hardhat 31337 hoặc Sepolia 11155111), chấp nhận luôn!
  if (isSupportedChain(currentChainId)) {
    return;
  }

  const targetChainId = Number(contractJson.chainId || 31337);
  if (typeof window !== "undefined" && window.ethereum) {
    const hexChainId = "0x" + targetChainId.toString(16);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }]
      });
    } catch (switchError) {
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        if (targetChainId === 31337) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hexChainId,
                chainName: "Hardhat Localhost",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }
              }
            ]
          });
        }
      } else {
        throw new Error(`MetaMask đang ở chain ${network.chainId}; hãy chuyển sang mạng Hardhat (31337) hoặc Sepolia (11155111) trong MetaMask.`);
      }
    }
    const newProvider = new ethers.BrowserProvider(window.ethereum);
    const newSigner = await newProvider.getSigner();
    walletSigner.provider = newProvider;
    walletSigner.signer = newSigner;
    network = await newProvider.getNetwork();
  }

  if (!isSupportedChain(Number(network.chainId))) {
    throw new Error(`MetaMask đang ở chain ${network.chainId}; hãy chuyển sang chain ${targetChainId} của contract.`);
  }
};

// 7. Cấp chứng chỉ mới (Tích hợp: Backend MySQL Draft -> Smart Contract Soulbound -> Backend Confirm)
export const issueCertificateOnChain = async (certData, walletSigner) => {
  if (!walletSigner?.signer) throw new Error("Hãy kết nối MetaMask trước khi phát hành.");

  const rawRecipient = (certData.wallet_address || "").trim();
  if (!rawRecipient || !ethers.isAddress(rawRecipient.toLowerCase())) {
    throw new Error("Địa chỉ ví của học viên không hợp lệ (cần địa chỉ Ethereum 42 ký tự).");
  }
  const recipientAddress = ethers.getAddress(rawRecipient.toLowerCase());

  await ensureCorrectNetwork(walletSigner);

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

  let activeChainId = 31337;
  try {
    const net = await walletSigner.signer.provider.getNetwork();
    activeChainId = Number(net.chainId);
  } catch {}
  const targetContractAddress = getTargetContractAddress(activeChainId);
  const contract = new ethers.Contract(targetContractAddress, CONTRACT_ABI, walletSigner.signer);
  const expiryTimestamp = certData.expiry_date
    ? Math.floor(new Date(certData.expiry_date).getTime() / 1000)
    : 0;

  // Tạo phôi ảnh SVG nhúng trực tiếp (On-Chain Data URI) để ví MetaMask và NFT Explorer luôn hiển thị ảnh đẹp mắt
  const svgCertificateImage = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#04121e"/>
      <stop offset="60%" stop-color="#0b2942"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" rx="16" fill="url(#bgGrad)"/>
  <rect x="16" y="16" width="568" height="368" rx="12" fill="none" stroke="url(#goldGrad)" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="300" cy="65" r="24" fill="#0284c7" opacity="0.3"/>
  <path d="M300 48 L312 58 L307 72 L293 72 L288 58 Z" fill="#fbbf24"/>
  <text x="300" y="115" fill="#f8fafc" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" letter-spacing="2">CERTIFICATE OF ACHIEVEMENT</text>
  <text x="300" y="138" fill="#94a3b8" font-family="Arial, sans-serif" font-size="11" text-anchor="middle">SOULBOUND TOKEN • OFFICIAL BLOCKCHAIN RECORD</text>
  <text x="300" y="185" fill="#38bdf8" font-family="Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">${certData.student_name}</text>
  <text x="300" y="215" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="13" text-anchor="middle">${certData.course_name}</text>
  <rect x="210" y="240" width="180" height="32" rx="16" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" stroke-width="1"/>
  <text x="300" y="262" fill="#fbbf24" font-family="Arial, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">${certData.score}</text>
  <text x="35" y="340" fill="#64748b" font-family="monospace" font-size="10">CODE: ${certData.certificate_code}</text>
  <text x="565" y="340" fill="#64748b" font-family="monospace" font-size="10" text-anchor="end">DATE: ${certData.issue_date || new Date().toISOString().slice(0, 10)}</text>
  <text x="300" y="362" fill="#0ea5e9" font-family="Arial, sans-serif" font-size="9" text-anchor="middle">NON-TRANSFERABLE SBT • CAMBRIDGE &amp; BRITISH ACADEMY</text>
</svg>
`)}`;

  const metadataPayload = {
    name: `${certData.course_name} - ${certData.student_name}`,
    description: `Chứng chỉ tiếng Anh chuẩn Soulbound NFT (ERC-721 Không thể chuyển nhượng) cấp cho ${certData.student_name}. Đạt kết quả: ${certData.score}. Bảo chứng toàn vẹn dữ liệu mật mã trên Smart Contract và IPFS.`,
    image: svgCertificateImage,
    external_url: `http://localhost:5173/verify?code=${certData.certificate_code}`,
    attributes: [
      { trait_type: "Mã chứng chỉ", value: certData.certificate_code },
      { trait_type: "Họ và tên", value: certData.student_name },
      { trait_type: "Mã học viên", value: certData.student_code },
      { trait_type: "Khóa học", value: certData.course_name },
      { trait_type: "Điểm số Overall", value: certData.score },
      { trait_type: "Nghe (Listening)", value: certData.listening || "-" },
      { trait_type: "Đọc (Reading)", value: certData.reading || "-" },
      { trait_type: "Viết (Writing)", value: certData.writing || "-" },
      { trait_type: "Nói (Speaking)", value: certData.speaking || "-" },
      { trait_type: "Ngày cấp", value: certData.issue_date || new Date().toISOString().slice(0, 10) },
      { trait_type: "Hạn hiệu lực", value: certData.expiry_date || "Vô thời hạn" },
      { trait_type: "Chuẩn Token", value: "Soulbound Token (ERC-721 Non-Transferable)" }
    ],
    code: certData.certificate_code,
    score: certData.score,
    ipfs: ipfsHash
  };

  const tokenURI = `data:application/json;utf8,${encodeURIComponent(JSON.stringify(metadataPayload))}`;

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

  await ensureCorrectNetwork(walletSigner);

  let activeChainId = 31337;
  try {
    const net = await walletSigner.signer.provider.getNetwork();
    activeChainId = Number(net.chainId);
  } catch {}
  const targetContractAddress = getTargetContractAddress(activeChainId);
  const contract = new ethers.Contract(targetContractAddress, CONTRACT_ABI, walletSigner.signer);
  const tx = await contract.revokeCertificate(tokenId, reason);
  const receipt = await tx.wait();
  if (receipt?.status !== 1) throw new Error(`Giao dịch thu hồi thất bại (${tx.hash}).`);

  try {
    await certificateApi.revokeCertificate(certId, reason, tx.hash);
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

// 9. Tra cứu toàn bộ chứng chỉ theo địa chỉ ví học viên (Đọc trực tiếp Smart Contract Web3 - Phương án 1)
export const getCertificatesByStudentWallet = async (walletAddress) => {
  if (!walletAddress || !ethers.isAddress(walletAddress.trim())) {
    throw new Error("Địa chỉ ví Ethereum không hợp lệ (cần 42 ký tự bắt đầu bằng 0x).");
  }
  const cleanAddress = ethers.getAddress(walletAddress.trim());
  const byCode = new Map();

  // B1: Đọc trực tiếp toàn bộ Soulbound Certificate NFT từ Smart Contract (Read-Only RPC hoặc MetaMask)
  try {
    const contract = getReadOnlyContract();
    if (contract) {
      const tokenIds = await contract.getCertificatesByStudent(cleanAddress);
      for (const tid of tokenIds) {
        const cert = await contract.getCertificateDetails(tid);
        byCode.set(cert.certificateCode, {
          id: Number(cert.tokenId),
          certificate_code: cert.certificateCode,
          student_name: cert.recipientName,
          student_code: cert.studentCode,
          course_name: cert.courseName,
          course_code: cert.courseCode,
          score: cert.score,
          issue_date: new Date(Number(cert.issueDate) * 1000).toISOString().slice(0, 10),
          expiry_date: Number(cert.expiryDate) > 0 ? new Date(Number(cert.expiryDate) * 1000).toISOString().slice(0, 10) : null,
          status: cert.isRevoked ? "REVOKED" : "ISSUED_ON_CHAIN",
          wallet_address: cert.recipientAddress,
          token_id: cert.tokenId.toString(),
          tx_hash: cert.certHash,
          ipfs_hash: cert.ipfsHash,
          pdf_url: `http://localhost:5000/api/public/pdf/${cert.certificateCode}`,
          revoked_reason: cert.revokeReason || null,
          onchain_verified: true
        });
      }
    }
  } catch (err) {
    console.warn("Đọc trực tiếp Smart Contract theo ví:", err.message);
  }

  // B2: Bổ sung thêm dữ liệu nếu Backend có endpoint /public/wallet/:address
  try {
    const res = await certificateApi.getPublicByWallet(cleanAddress);
    if (res?.success && Array.isArray(res.data)) {
      for (const d of res.data) {
        if (!byCode.has(d.certificate_code)) {
          byCode.set(d.certificate_code, {
            id: d.id,
            certificate_code: d.certificate_code,
            student_name: d.student_name,
            student_code: d.student_code,
            citizen_id: maskCitizenId(d.citizen_id),
            course_name: d.course_name,
            course_code: d.course_code,
            score: d.score_overall,
            issue_date: d.issue_date ? String(d.issue_date).slice(0, 10) : "",
            expiry_date: d.expiry_date ? String(d.expiry_date).slice(0, 10) : null,
            status: d.status,
            wallet_address: d.student_wallet || cleanAddress,
            token_id: d.token_id,
            tx_hash: d.tx_hash,
            ipfs_hash: d.ipfs_hash || null,
            pdf_url: `http://localhost:5000/api/public/pdf/${d.certificate_code}`,
            revoked_reason: d.revoke_reason || null,
            onchain_verified: Boolean(d.onchain_verified)
          });
        }
      }
    }
  } catch {
    // Bỏ qua nếu Backend chưa có endpoint /public/wallet
  }

  return Array.from(byCode.values());
};

export { INITIAL_STUDENTS, INITIAL_COURSES };
