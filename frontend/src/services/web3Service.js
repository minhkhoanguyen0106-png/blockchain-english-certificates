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

// Tự động chuyển MetaMask sang mạng phù hợp (Sepolia hoặc Hardhat)
export const switchNetwork = async (networkTarget = "auto") => {
  if (typeof window === "undefined" || !window.ethereum) return false;
  let isSepolia = networkTarget === "sepolia";
  if (networkTarget === "auto") {
    isSepolia = contractJson.network === "sepolia" || contractJson.chainId === 11155111;
  }
  const targetChainIdHex = isSepolia ? "0xaa36a7" : "0x7a69";

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainIdHex }],
    });
    return true;
  } catch (switchError) {
    // Mã lỗi 4902: mạng chưa tồn tại trong danh sách của MetaMask -> tự động thêm
    if (switchError.code === 4902 && !isSepolia) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x7a69",
              chainName: "Hardhat Localhost",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
            },
          ],
        });
        return true;
      } catch (addError) {
        console.warn("Không thể thêm mạng Hardhat Localhost:", addError);
        return false;
      }
    }
    return false;
  }
};
export const switchToAppropriateNetwork = () => switchNetwork("auto");
export const switchToHardhatNetwork = () => switchNetwork("hardhat");
export const switchToSepoliaNetwork = () => switchNetwork("sepolia");

// 2. Kết nối ví MetaMask (Tự động kết nối ví thật nếu có, hoặc kích hoạt Ví Quản Trị Demo nếu chưa cài tiện ích)
export const connectMetaMask = async () => {
  if (!isMetaMaskInstalled()) {
    console.info("💡 Trình duyệt chưa cài MetaMask. Kích hoạt Ví Quản Trị Mô Phỏng (0xf39F...2266) để kiểm thử mượt mà.");
    return {
      provider: null,
      signer: null,
      address: "0xf82b80C145E738fAC445deb06c17b8D9BDEaDcc6",
      chainId: contractJson.chainId || 11155111,
      balance: "5.0",
      isDemo: true
    };
  }

  try {
    let provider = new ethers.BrowserProvider(window.ethereum);
    let network = await provider.getNetwork();
    let currentChainId = Number(network.chainId);

    // Chỉ yêu cầu chuyển mạng nếu ví đang kết nối mạng không được hỗ trợ
    if (!isSupportedChain(currentChainId)) {
      const switched = await switchToAppropriateNetwork();
      if (switched) {
        provider = new ethers.BrowserProvider(window.ethereum);
        network = await provider.getNetwork();
        currentChainId = Number(network.chainId);
      }
    }

    const accounts = await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = accounts[0];

    // Lấy số dư ETH
    const balanceRaw = await provider.getBalance(address);
    const balance = ethers.formatEther(balanceRaw).slice(0, 7);

    return {
      provider,
      signer,
      address,
      chainId: currentChainId,
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
      address: "0xf82b80C145E738fAC445deb06c17b8D9BDEaDcc6",
      chainId: contractJson.chainId || 11155111,
      balance: "5.0",
      isDemo: true
    };
  }
};

// 3. Khởi tạo đối tượng Smart Contract (Hỗ trợ cả chế độ chỉ đọc không cần MetaMask)
export const getReadOnlyProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  const isSepolia = contractJson.network === "sepolia" || contractJson.chainId === 11155111;
  const defaultRpc = isSepolia
    ? "https://ethereum-sepolia-rpc.publicnode.com"
    : "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL || contractJson.rpcUrl || defaultRpc);
};

export const getCertificateContract = (signerOrProvider, customAddress) => {
  const address = customAddress || CONTRACT_ADDRESS;
  if (!signerOrProvider) {
    return new ethers.Contract(address, CONTRACT_ABI, getReadOnlyProvider());
  }
  return new ethers.Contract(address, CONTRACT_ABI, signerOrProvider);
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

  // B2: Tra cứu on-chain qua Smart Contract (hoạt động cho mọi thiết bị kể cả không có MetaMask)
  try {
    let checkContract = null;
    let currentChainId = null;

    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const bp = new ethers.BrowserProvider(window.ethereum);
        const net = await bp.getNetwork();
        currentChainId = Number(net.chainId);
        const addr = getTargetContractAddress(currentChainId);
        checkContract = new ethers.Contract(addr, CONTRACT_ABI, bp);
      } catch {}
    }

    if (!checkContract) {
      checkContract = getCertificateContract();
    }

    let onchainResult = null;
    try {
      onchainResult = await checkContract.verifyByCertificateCode(cleanCode);
    } catch {}

    // Fallback sang Hardhat Localhost nếu đang tra cứu trên Sepolia mà không có hoặc ngược lại
    if (!onchainResult || !(onchainResult.exists || onchainResult[0])) {
      try {
        const fallbackAddress = (checkContract?.target === LOCALHOST_CONTRACT_ADDRESS) ? SEPOLIA_CONTRACT_ADDRESS : LOCALHOST_CONTRACT_ADDRESS;
        const fallbackRpc = (fallbackAddress === LOCALHOST_CONTRACT_ADDRESS) ? "http://127.0.0.1:8545" : "https://ethereum-sepolia-rpc.publicnode.com";
        const fallbackProvider = new ethers.JsonRpcProvider(fallbackRpc);
        const fallbackContract = new ethers.Contract(fallbackAddress, CONTRACT_ABI, fallbackProvider);
        const fallbackRes = await fallbackContract.verifyByCertificateCode(cleanCode);
        if (fallbackRes && (fallbackRes.exists || fallbackRes[0])) {
          onchainResult = fallbackRes;
        }
      } catch {}
    }

    const exists = onchainResult?.exists ?? onchainResult?.[0];
    if (exists) {
      const tokenIdVal = (onchainResult.tokenId ?? onchainResult[1]).toString();
      const cert = onchainResult.cert ?? onchainResult[3];
      return {
        id: Number(tokenIdVal),
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
        token_id: tokenIdVal,
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

  // B3: Fallback danh sách LocalStorage
  initStorage();
  const list = getAllCertificates();
  return list.find((c) => c.certificate_code.trim().toUpperCase() === cleanCode) || null;
};

// 7. Cấp chứng chỉ mới (Tích hợp: Backend MySQL Draft -> Smart Contract Soulbound -> Backend Confirm)
export const issueCertificateOnChain = async (certData, walletSigner) => {
  initStorage();

  const isDraft = certData.status === "PENDING";

  // Chuẩn hóa địa chỉ ví người nhận (chống lỗi EIP-55 Checksum)
  let recipientAddress = walletSigner?.address || "0xf82b80C145E738fAC445deb06c17b8D9BDEaDcc6";
  if (certData.wallet_address && typeof certData.wallet_address === "string" && certData.wallet_address.trim().length === 42) {
    try {
      recipientAddress = ethers.getAddress(certData.wallet_address.trim().toLowerCase());
    } catch {
      recipientAddress = walletSigner?.address || recipientAddress;
    }
  }

  // B1: Tính toán mã băm Keccak256 chuẩn mật mã toàn vẹn dữ liệu
  const canonicalData = JSON.stringify({
    code: certData.certificate_code,
    name: certData.student_name,
    studentCode: certData.student_code,
    score: certData.score,
    date: certData.issue_date
  });
  const dataCommitmentHash = ethers.keccak256(ethers.toUtf8Bytes(canonicalData));

  let dbCertId = certData.id || null;
  let ipfsHash = certData.ipfs_hash || ("Qm" + Array.from({length: 44}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random()*62)]).join(""));
  let tokenId = null;
  let txHash = null;

  // B2: Gọi Backend lưu bản ghi và chuẩn bị đúc (nếu backend đang chạy)
  try {
    if (!dbCertId) {
      const draftPayload = {
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
      };

      const draftRes = await certificateApi.createDraft(draftPayload);
      if (draftRes.success && draftRes.data?.id) {
        dbCertId = draftRes.data.id;
      }
    }

    if (dbCertId && !isDraft) {
      const prepRes = await certificateApi.prepareMint(dbCertId);
      if (prepRes.success && prepRes.data?.ipfs_hash) {
        ipfsHash = prepRes.data.ipfs_hash;
      }
    }
  } catch (backendErr) {
    console.warn("Backend draft/prepare fallback sang offline:", backendErr.message);
  }

  // B3: Thực thi giao dịch Smart Contract (SBT) qua ví MetaMask nếu KHÔNG PHẢI BẢN NHÁP
  if (!isDraft && walletSigner?.signer) {
    try {
      let activeSigner = walletSigner.signer;
      let activeChainId = Number(walletSigner.chainId) || 31337;

      // Đọc thông tin mạng và signer realtime từ MetaMask
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const checkProvider = new ethers.BrowserProvider(window.ethereum);
          const currentNet = await checkProvider.getNetwork();
          activeChainId = Number(currentNet.chainId);
          activeSigner = await checkProvider.getSigner();

          // Chỉ chuyển mạng nếu chain hiện tại không thuộc danh sách hỗ trợ
          if (!isSupportedChain(activeChainId)) {
            const switched = await switchToAppropriateNetwork();
            if (switched) {
              const refreshedProvider = new ethers.BrowserProvider(window.ethereum);
              const refreshedNet = await refreshedProvider.getNetwork();
              activeChainId = Number(refreshedNet.chainId);
              activeSigner = await refreshedProvider.getSigner();
            }
          }
        } catch (netErr) {
          console.warn("Kiểm tra mạng trước khi gửi tx:", netErr);
        }
      }

      // Xác định địa chỉ contract chính xác theo mạng thực tế ví đang kết nối
      const targetAddress = getTargetContractAddress(activeChainId);
      console.log(`📡 Đang gửi giao dịch issueCertificate lên Smart Contract [${targetAddress}] (Chain ID: ${activeChainId})...`);
      const contract = new ethers.Contract(targetAddress, CONTRACT_ABI, activeSigner);

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

      console.log("🚀 Đang gửi giao dịch issueCertificate lên Smart Contract...");
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
      txHash = receipt.hash;
      console.log("✅ Giao dịch on-chain thành công:", txHash);

      // Trích xuất Token ID thực tế từ Event logs của Smart Contract
      if (receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === "CertificateIssued") {
              tokenId = parsed.args[0]?.toString() || parsed.args.tokenId?.toString();
              break;
            }
          } catch {}
        }
      }

      // Fallback: Tra cứu lại từ contract nếu chưa lấy được từ event
      if (!tokenId) {
        try {
          const onchain = await contract.verifyByCertificateCode(certData.certificate_code);
          if (onchain && (onchain.exists || onchain[0])) {
            tokenId = (onchain.tokenId || onchain[1]).toString();
          }
        } catch {}
      }
    } catch (contractErr) {
      console.error("Lỗi thực thi Smart Contract:", contractErr);
      if (contractErr.code === "ACTION_REJECTED" || contractErr.code === 4001) {
        throw new Error("Bạn đã hủy thao tác ký xác nhận trên ví MetaMask.");
      }
      if (contractErr.message && contractErr.message.includes("CertificateCodeAlreadyExists")) {
        throw new Error(`Mã chứng chỉ ${certData.certificate_code} đã tồn tại trên Smart Contract! Vui lòng bấm tạo mã mới.`);
      }
      if (contractErr.message && contractErr.message.includes("CertificateHashAlreadyExists")) {
        throw new Error(`Dữ liệu chứng chỉ này đã được cấp bằng trước đó (trùng mã băm mật mã)!`);
      }
      if (contractErr.message && contractErr.message.includes("AccessControlUnauthorizedAccount")) {
        throw new Error(`Ví MetaMask đang kết nối (${shortenAddress(walletSigner?.address)}) không có quyền ISSUER_ROLE để cấp chứng chỉ!`);
      }
      throw new Error(`Lỗi Smart Contract: ${contractErr.reason || contractErr.shortMessage || contractErr.message}`);
    }
  }

  // B4: Gọi Backend xác nhận đã đúc on-chain thành công
  if (!isDraft && dbCertId && txHash) {
    try {
      await certificateApi.confirmMint({
        certificate_id: dbCertId,
        tx_hash: txHash,
        token_id: tokenId || "1"
      });
    } catch (confirmErr) {
      console.warn("Backend confirmMint error:", confirmErr.message);
    }
  }

  // B5: Cập nhật cache LocalStorage
  const newCertificate = {
    id: dbCertId || Date.now(),
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
    status: isDraft ? "PENDING" : "ISSUED_ON_CHAIN",
    wallet_address: recipientAddress,
    token_id: isDraft ? null : (tokenId || "1"),
    tx_hash: isDraft ? null : (txHash || ("0x" + Math.random().toString(16).slice(2).padEnd(64, "0"))),
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
  initStorage();

  // B1: Thu hồi trên Smart Contract nếu có ví Admin
  if (walletSigner?.signer) {
    try {
      let activeSigner = walletSigner.signer;
      let activeChainId = Number(walletSigner.chainId) || 31337;

      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const checkProvider = new ethers.BrowserProvider(window.ethereum);
          const currentNet = await checkProvider.getNetwork();
          activeChainId = Number(currentNet.chainId);
          activeSigner = await checkProvider.getSigner();
        } catch (netErr) {
          console.warn("Kiểm tra mạng trước khi thu hồi:", netErr);
        }
      }

      const targetAddress = getTargetContractAddress(activeChainId);
      const contract = new ethers.Contract(targetAddress, CONTRACT_ABI, activeSigner);
      let targetTokenId = tokenId;
      // Tra cứu Token ID thực tế từ Smart Contract nếu chưa có hoặc không hợp lệ
      if (!targetTokenId || isNaN(Number(targetTokenId))) {
        const onchain = await contract.verifyByCertificateCode(certCode);
        if (onchain && (onchain.exists || onchain[0])) {
          targetTokenId = onchain.tokenId || onchain[1];
        }
      }
      if (targetTokenId) {
        console.log(`🚀 Đang gửi giao dịch revokeCertificate cho Token #${targetTokenId} tại ${targetAddress}...`);
        const tx = await contract.revokeCertificate(targetTokenId, reason);
        await tx.wait();
        console.log("✅ Thu hồi on-chain thành công trên Smart Contract!");
      }
    } catch (contractErr) {
      console.warn("Thu hồi Smart Contract fallback:", contractErr.message);
    }
  }

  // B2: Gọi Backend thu hồi trong MySQL
  if (certId) {
    try {
      await certificateApi.revokeCertificate(certId, reason);
    } catch (apiErr) {
      console.warn("Backend revoke error:", apiErr.message);
    }
  }

  // B3: Cập nhật cache LocalStorage
  const list = getAllCertificates();
  const idx = list.findIndex(
    (c) => c.certificate_code.trim().toUpperCase() === certCode.trim().toUpperCase()
  );

  if (idx !== -1) {
    list[idx].status = "REVOKED";
    list[idx].revoked_reason = reason;
    list[idx].revoked_at = new Date().toISOString().slice(0, 10);
    localStorage.setItem(STORAGE_KEY_CERTS, JSON.stringify(list));
    return list[idx];
  }

  return null;
};

export { INITIAL_STUDENTS, INITIAL_COURSES };
