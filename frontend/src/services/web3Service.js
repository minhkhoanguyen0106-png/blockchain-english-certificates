// ============================================================================
// DỊCH VỤ WEB3 & METAMASK (web3Service.js)
// Vai trò: Cầu nối giữa giao diện Frontend (React) với Ví MetaMask,
//          Mạng Blockchain (Sepolia qua Alchemy RPC) và Smart Contract NFT/SBT.
// ============================================================================

import { ethers } from "ethers"; // Thư viện chuẩn giúp Frontend giao tiếp với Ethereum & MetaMask
import contractJson from "../contracts/EnglishCertificateNFT.json"; // Chứa địa chỉ Smart Contract, chainId và ABI (danh sách hàm của contract)
import { API_BASE_URL, certificateApi } from "./apiService";

// Khóa dùng để lưu cache danh sách chứng chỉ trong LocalStorage của trình duyệt
const STORAGE_KEY_CERTS = "certchain_certificates";

// ============================================================================
// CẤU HÌNH SMART CONTRACT & CỔNG ĐỌC RPC
// - MetaMask (Ví nóng): giữ cặp khóa Public/Private để chứng minh chủ sở hữu ví và ký giao dịch.
// - Chữ ký số: được tạo ra từ Private Key + Nội dung giao dịch qua thuật toán ký ECDSA (secp256k1).
// - Địa chỉ Smart Contract: nơi lưu code Solidity và dữ liệu chứng chỉ bất biến trên Sepolia.
// ============================================================================
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  contractJson.address ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Địa chỉ Smart Contract (ưu tiên biến môi trường .env -> rồi tới file JSON)

export const CONTRACT_ABI = contractJson.abi; // ABI = "mục lục JSON" mô tả các hàm & sự kiện của Smart Contract

// Đường link RPC (Alchemy Sepolia) chỉ để ĐỌC dữ liệu công khai (không cần cài MetaMask, không tốn phí Gas)
const READONLY_RPC_URL = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

// Hàm phụ: Che bớt số CCCD ở giữa (VD: 079204012345 -> 079******345) để bảo vệ quyền riêng tư khi tra cứu công khai
const maskCitizenId = (cid) => {
  if (!cid) return null;
  const s = String(cid).trim();
  if (s.length <= 6) return "***";
  return `${s.slice(0, 3)}${"*".repeat(Math.max(3, s.length - 6))}${s.slice(-3)}`;
};

// Hàm phụ: Tạo đối tượng Smart Contract ở chế độ CHỈ ĐỌC (Read-Only)
// -> Dùng cho trang Tra cứu công khai (/verify) để học viên & nhà tuyển dụng xem bằng mà KHÔNG cần cài MetaMask
const getReadOnlyContract = () => {
  try {
    // Kết nối trực tiếp lên mạng Sepolia thông qua cổng Alchemy RPC
    const provider = new ethers.JsonRpcProvider(READONLY_RPC_URL);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  } catch {
    // Dự phòng: nếu RPC lỗi mà trình duyệt có sẵn MetaMask thì mượn provider của MetaMask để đọc
    if (isMetaMaskInstalled()) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    }
    return null;
  }
};

// Khởi tạo bộ nhớ cache rỗng trong LocalStorage nếu trình duyệt chưa từng lưu
export const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEY_CERTS)) {
    localStorage.setItem(STORAGE_KEY_CERTS, JSON.stringify([]));
  }
};

// ============================================================================
// 1. KIỂM TRA METAMASK ĐÃ ĐƯỢC CÀI TRÊN TRÌNH DUYỆT CHƯA
// - export: cho phép các file khác (AdminLayout, IssueCertPage...) import hàm này
// - typeof window !== "undefined": đảm bảo code đang chạy trong trình duyệt
// - Boolean(window.ethereum): khi cài extension MetaMask, Chrome sẽ tự tiêm đối tượng
//   window.ethereum (chuẩn EIP-1193) vào trang web -> có thì trả true, chưa cài trả false
// ============================================================================
export const isMetaMaskInstalled = () => {
  return typeof window !== "undefined" && Boolean(window.ethereum);
};

// ============================================================================
// 2. KẾT NỐI VÍ METAMASK (Dành cho ADMIN bấm nút "Kết Nối Ví Ký")
// - async / await: xử lý bất đồng bộ (chờ người dùng bấm xác nhận trên popup MetaMask)
// - Lưu ý bảo mật: web CHỈ nhận được Địa chỉ ví công khai & Signer, KHÔNG BAO GIỜ đọc được Private Key
// ============================================================================
export const connectMetaMask = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error("Cần cài MetaMask để kết nối ví blockchain.");
  }

  try {
    // Tạo cầu nối (BrowserProvider) giữa thư viện ethers.js và extension MetaMask (window.ethereum)
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Gửi yêu cầu "eth_requestAccounts" -> bật popup MetaMask hỏi người dùng cho phép kết nối ví
    const accounts = await provider.send("eth_requestAccounts", []);

    // Lấy đối tượng Signer: đại diện cho ví đang chọn, có quyền yêu cầu MetaMask bật popup ký giao dịch
    const signer = await provider.getSigner();

    // Lấy địa chỉ ví công khai đầu tiên người dùng vừa chọn (VD: 0xf82b80...aDcc6)
    const address = accounts[0];

    // Đọc thông tin mạng hiện tại MetaMask đang đứng (VD: Sepolia có chainId = 11155111)
    const network = await provider.getNetwork();

    // Lấy số dư ETH (dạng Wei - đơn vị nhỏ nhất) rồi đổi sang ETH dễ đọc bằng ethers.formatEther
    const balanceRaw = await provider.getBalance(address);
    const balance = ethers.formatEther(balanceRaw).slice(0, 6);

    // Trả toàn bộ thông tin ví về cho App.jsx lưu vào state `wallet` dùng chung
    return {
      provider,
      signer,
      address,
      chainId: Number(network.chainId),
      balance,
      isDemo: false
    };
  } catch (err) {
    // Mã lỗi 4001 chuẩn EIP-1193: người dùng bấm nút "Hủy / Từ chối" trên popup MetaMask
    if (err.code === 4001) {
      throw new Error("Bạn đã từ chối yêu cầu kết nối ví MetaMask.");
    }
    throw new Error("Không thể kết nối MetaMask. Hãy kiểm tra tiện ích ví và thử lại.");
  }
};

// ============================================================================
// 3. KHỞI TẠO ĐỐI TƯỢNG SMART CONTRACT ĐỂ GỌI HÀM
// - Nếu truyền vào `signer` (từ MetaMask) -> gọi được cả hàm ĐỌC lẫn hàm GHI (cấp bằng, thu hồi)
// - Nếu truyền vào `provider` (hoặc không truyền) -> chỉ gọi được các hàm ĐỌC miễn phí
// ============================================================================
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

// ============================================================================
// 4. RÚT GỌN ĐỊA CHỈ VÍ HOẶC MÃ GIAO DỊCH ĐỂ HIỂN THỊ GỌN TRÊN UI
// VD: "0xf82b80C145E738fAC445deb06c17b8D9BDEaDcc6" -> "0xf82b...Dcc6"
// ============================================================================
export const shortenAddress = (addr) => {
  if (!addr) return "";
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

// ============================================================================
// 5. LẤY DANH SÁCH CHỨNG CHỈ TỪ CACHE LOCALSTORAGE (Dự phòng khi offline)
// ============================================================================
export const getAllCertificates = () => {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEY_CERTS);
  return raw ? JSON.parse(raw) : [];
};

// ============================================================================
// 6. TRA CỨU & XÁC THỰC CHỨNG CHỈ THEO MÃ (Trang công khai /verify)
// Cơ chế chống giả mạo 3 lớp:
//   B1: Lấy dữ liệu chi tiết từ Backend MySQL (Aiven Cloud)
//   B2: Đọc dữ liệu gốc bất biến từ Smart Contract trên Blockchain (qua Alchemy RPC, không cần MetaMask)
//   B3: So sánh chéo từng trường (Tên, Điểm, Mã HV, Khóa học) + tự tính lại SHA-256 của file PDF
//       -> Nếu lệch bất kỳ chi tiết nào -> gắn cờ TAMPERED (bị chỉnh sửa/giả mạo)!
// ============================================================================
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
        citizen_id: maskCitizenId(d.citizen_id), // Che bớt CCCD trước khi hiển thị công khai
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
        wallet_address: d.student_wallet || "",
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
    // Backend offline hoặc không có trong MySQL -> vẫn tiếp tục kiểm tra trực tiếp trên Smart Contract ở B2
  }

  // B2: Đối soát trực tiếp On-chain qua Smart Contract (dùng Read-Only RPC, không cần MetaMask)
  try {
    const contract = getReadOnlyContract();
    if (contract) {
      const lookupCode = dbCert?.certificate_code || cleanCode;
      // Gọi hàm view `verifyByCertificateCode` trên Smart Contract (đọc miễn phí)
      const onchainResult = await contract.verifyByCertificateCode(lookupCode);
      if (onchainResult && onchainResult.exists) {
        const cert = onchainResult.cert;

        // Trường hợp 1: Có cả trong MySQL lẫn trên Blockchain -> tiến hành đối chiếu chống gian lận
        if (dbCert) {
          dbCert.onchain_verified = true;
          const mismatches = []; // Danh sách các trường bị lệch giữa MySQL và sổ cái Blockchain
          let documentCheckUnavailable = false;

          // So sánh Tên, Điểm, Mã học viên, Mã khóa học giữa CSDL và sổ cái bất biến
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

          // Kiểm tra toàn vẹn file PDF bằng Hàm băm SHA-256 (Web Crypto API)
          // -> Tải PDF thật, băm SHA-256 rồi đối chiếu với `cert.certHash` đang khóa trên Blockchain
          try {
            if (!window.crypto?.subtle) throw new Error("Web Crypto unavailable");
            const pdfResponse = await fetch(`${API_BASE_URL}/public/pdf/${encodeURIComponent(dbCert.certificate_code)}`);
            if (!pdfResponse.ok) throw new Error("PDF unavailable");
            const pdfDigest = await window.crypto.subtle.digest("SHA-256", await pdfResponse.arrayBuffer());
            const pdfHash = ethers.hexlify(new Uint8Array(pdfDigest)).toLowerCase();
            if (pdfHash !== String(cert.certHash).toLowerCase()) {
              mismatches.push("Hash SHA-256 của PDF không khớp với bằng chứng trên blockchain");
            } else {
              dbCert.document_hash_verified = true;
            }
          } catch {
            // Không tải được PDF từ gateway -> không dám kết luận hợp lệ, đánh dấu cần xác minh lại
            dbCert.document_hash_verified = false;
            documentCheckUnavailable = true;
          }

          // Kết luận trạng thái cuối cùng theo độ ưu tiên bảo mật cao nhất
          if (mismatches.length > 0) {
            dbCert.status = "TAMPERED"; // Phát hiện dữ liệu CSDL hoặc PDF bị sửa trái phép!
            dbCert.tamper_details = mismatches.join("; ");
          } else if (cert.isRevoked && dbCert.status !== "REVOKED") {
            dbCert.status = "REVOKED"; // Trên chuỗi đã thu hồi -> ưu tiên tin theo sổ cái Blockchain
            dbCert.revoked_reason = cert.revokeReason || dbCert.revoked_reason || "Đã bị thu hồi trên Blockchain";
          } else if (Number(cert.expiryDate) > 0 && Number(cert.expiryDate) * 1000 < Date.now()) {
            dbCert.status = "EXPIRED"; // Quá hạn hiệu lực (đổi giây Unix trên Solidity -> mili-giây JS)
          } else if (documentCheckUnavailable) {
            dbCert.status = "UNVERIFIED"; // Thiếu kiểm tra PDF nên chưa kết luận hợp lệ tuyệt đối
          } else if (!onchainResult.isValid) {
            dbCert.status = "UNVERIFIED";
          }
          return dbCert;
        }

        // Trường hợp 2: MySQL bị tắt hoặc bị xóa dữ liệu, nhưng chứng chỉ VẪN TỒN TẠI bất biến trên Blockchain!
        // -> Đọc trực tiếp PDF từ IPFS và tự băm SHA-256 để xác minh độc lập
        let documentStatus = "UNVERIFIED";
        try {
          if (!window.crypto?.subtle) throw new Error("Web Crypto unavailable");
          const gateway = (import.meta.env.VITE_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/").replace(/\/?$/, "/");
          const response = await fetch(`${gateway}${encodeURIComponent(cert.ipfsHash)}`);
          if (!response.ok) throw new Error("PDF unavailable");
          const digest = await window.crypto.subtle.digest("SHA-256", await response.arrayBuffer());
          documentStatus = ethers.hexlify(new Uint8Array(digest)).toLowerCase() === String(cert.certHash).toLowerCase()
            ? (cert.isRevoked ? "REVOKED" : (Number(cert.expiryDate) > 0 && Number(cert.expiryDate) * 1000 < Date.now() ? "EXPIRED" : "ISSUED_ON_CHAIN"))
            : "TAMPERED";
        } catch { /* Giữ trạng thái chưa xác minh khi gateway không truy cập được. */ }
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
          status: documentStatus,
          wallet_address: cert.recipientAddress,
          token_id: onchainResult.tokenId.toString(),
          tx_hash: "0x" + cert.certHash.slice(2),
          ipfs_hash: cert.ipfsHash,
          pdf_url: `http://localhost:5000/api/public/pdf/${cert.certificateCode}`,
          revoked_reason: cert.revokeReason || null,
          revoked_at: null,
          onchain_verified: true,
          document_hash_verified: documentStatus !== "UNVERIFIED" && documentStatus !== "TAMPERED"
        };
      }
    }
  } catch (e) {
    console.warn("Tra cứu on-chain fallback:", e.message);
  }

  // Nếu chỉ thấy ở MySQL nhưng không đối chiếu được trên Blockchain -> gắn nhãn UNVERIFIED
  if (dbCert) {
    if (!dbCert.onchain_verified) dbCert.status = "UNVERIFIED";
    return dbCert;
  }
  return null;
};

// ============================================================================
// TỰ ĐỘNG KIỂM TRA & CHUYỂN MẠNG METAMASK SANG ĐÚNG CHAIN ID CỦA CONTRACT
// - So sánh chainId hiện tại của MetaMask với contractJson.chainId (VD: 11155111 = Sepolia)
// - Nếu lệch mạng: gửi lệnh `wallet_switchEthereumChain` để MetaMask bật popup đổi mạng
// - Nếu mạng chưa có trong MetaMask (mã lỗi 4902): gọi `wallet_addEthereumChain` để thêm mạng
// - Sau khi đổi mạng xong: khởi tạo lại provider & signer mới để tránh lỗi mạng cũ
// ============================================================================
export const ensureCorrectNetwork = async (walletSigner) => {
  if (!walletSigner?.signer?.provider) return;
  const targetChainId = Number(contractJson.chainId || 31337);
  let network = await walletSigner.signer.provider.getNetwork();

  if (Number(network.chainId) !== targetChainId) {
    if (typeof window !== "undefined" && window.ethereum) {
      // MetaMask yêu cầu chainId ở dạng chuỗi thập lục phân (VD: 11155111 -> "0xaa36a7")
      const hexChainId = "0x" + targetChainId.toString(16);
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: hexChainId }]
        });
      } catch (switchError) {
        // Mã lỗi 4902: MetaMask chưa lưu cấu hình mạng này -> yêu cầu thêm mạng mới
        if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
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
        } else {
          throw new Error(`MetaMask đang ở chain ${network.chainId}; hãy chuyển sang chain ${targetChainId} của contract trong MetaMask.`);
        }
      }
      // Làm mới provider và signer sau khi đổi mạng thành công
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      walletSigner.provider = newProvider;
      walletSigner.signer = newSigner;
      network = await newProvider.getNetwork();
    }
  }

  if (Number(network.chainId) !== targetChainId) {
    throw new Error(`MetaMask đang ở chain ${network.chainId}; hãy chuyển sang chain ${targetChainId} của contract.`);
  }
};

// ============================================================================
// 7. CẤP CHỨNG CHỈ MỚI LÊN BLOCKCHAIN (ADMIN ký MetaMask - Đúc Soulbound Token)
// Luồng 4 bước chuẩn:
//   B1: Kiểm tra ví học viên hợp lệ & chuyển MetaMask về đúng mạng Sepolia
//   B2: Đảm bảo có bản nháp trên MySQL -> gọi Backend `prepareMint` tạo PDF + băm SHA-256 + upload IPFS
//   B3: Gọi `contract.issueCertificate(...)` -> MetaMask bật popup cho Admin ký số & trả phí Gas -> chờ tx.wait()
//   B4: Đọc Token ID thật từ Smart Contract -> gọi Backend `confirmMint` đối soát & lưu trạng thái ISSUED_ON_CHAIN
// ============================================================================
export const issueCertificateOnChain = async (certData, walletSigner) => {
  if (!walletSigner?.signer) throw new Error("Hãy kết nối MetaMask trước khi phát hành.");

  // Kiểm tra và chuẩn hóa địa chỉ ví Ethereum của học viên (nếu học viên chưa có ví, tự động sinh ví định danh)
  let rawRecipient = (certData.wallet_address || "").trim();
  if (!rawRecipient || !ethers.isAddress(rawRecipient.toLowerCase())) {
    rawRecipient = ethers.Wallet.createRandom().address;
    certData.wallet_address = rawRecipient;
  }
  const recipientAddress = ethers.getAddress(rawRecipient.toLowerCase());

  // Đảm bảo MetaMask đang bật đúng mạng của Smart Contract
  await ensureCorrectNetwork(walletSigner);

  // B1: Tìm xem mã chứng chỉ này đã có bản nháp PENDING trên Backend chưa; chưa có thì tạo mới
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

  // B2: Gọi Backend chuẩn bị phát hành (tạo file PDF, tính mã băm SHA-256 và pin lên IPFS Pinata)
  const dbCertId = draftRes.data.id;
  const prepRes = await certificateApi.prepareMint(dbCertId);
  if (!prepRes?.success || !prepRes.data?.ipfs_hash) {
    throw new Error(prepRes?.message || "Không chuẩn bị được metadata phát hành.");
  }
  const ipfsHash = prepRes.data.ipfs_hash;
  const dataCommitmentHash = prepRes.data.data_commitment_hash; // Mã băm SHA-256 (32 byte) của file PDF
  if (!dataCommitmentHash || !ethers.isHexString(dataCommitmentHash, 32)) {
    throw new Error("Backend không trả về SHA-256 hợp lệ của PDF; đã dừng để tránh cấp chứng chỉ sai hash.");
  }

  // B3: Gắn signer của Admin vào Smart Contract và gửi giao dịch đúc chứng chỉ (MetaMask bật popup ký)
  const contract = getCertificateContract(walletSigner.signer);
  // Solidity dùng mốc thời gian Unix (tính bằng giây); 0 nghĩa là vô thời hạn
  const expiryTimestamp = certData.expiry_date
    ? Math.floor(new Date(certData.expiry_date).getTime() / 1000)
    : 0;
  const tokenURI = prepRes.data.token_uri;
  if (!tokenURI?.startsWith("ipfs://")) throw new Error("Metadata chưa có URI IPFS hợp lệ.");

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
  // Chờ mạng lưới Blockchain xác nhận giao dịch vào block (status === 1 là thành công)
  const receipt = await tx.wait();
  if (receipt?.status !== 1) throw new Error(`Giao dịch phát hành thất bại (${tx.hash}).`);

  // Đọc ngược lại Token ID thực tế vừa được Smart Contract cấp phát
  const onchainResult = await contract.verifyByCertificateCode(certData.certificate_code);
  if (!onchainResult?.exists) {
    throw new Error(`Giao dịch ${tx.hash} đã được xác nhận nhưng chưa đọc được chứng chỉ từ contract.`);
  }
  const tokenId = onchainResult.tokenId.toString();

  // B4: Gửi tx_hash và token_id về Backend xác minh độc lập rồi chốt trạng thái ISSUED_ON_CHAIN trong MySQL
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

// ============================================================================
// 8. THU HỒI CHỨNG CHỈ (ADMIN ký MetaMask - Đánh dấu REVOKED vĩnh viễn)
// - B1: Kiểm tra ví Admin & đúng mạng Sepolia
// - B2: Gọi `contract.revokeCertificate(tokenId, reason)` -> MetaMask bật popup ký & trả Gas
// - B3: Chờ block xác nhận (tx.wait) -> gửi `tx.hash` về Backend để cập nhật MySQL sang REVOKED
// ============================================================================
export const revokeCertificateOnChain = async (certCode, reason, certId, tokenId, walletSigner) => {
  if (!walletSigner?.signer) throw new Error("Hãy kết nối ví ADMIN trước khi thu hồi.");
  if (!certId || !tokenId) throw new Error("Chứng chỉ thiếu ID hoặc Token ID; không thể thu hồi an toàn.");

  await ensureCorrectNetwork(walletSigner);

  // Gửi giao dịch thu hồi lên Smart Contract (ghi vĩnh viễn lý do thu hồi lên sổ cái)
  const contract = getCertificateContract(walletSigner.signer);
  const tx = await contract.revokeCertificate(tokenId, reason);
  const receipt = await tx.wait();
  if (receipt?.status !== 1) throw new Error(`Giao dịch thu hồi thất bại (${tx.hash}).`);

  // Gửi tx.hash lên Backend để Backend tự kiểm tra Event CertificateRevoked rồi mới cập nhật DB
  try {
    await certificateApi.revokeCertificate(certId, reason, tx.hash);
  } catch (apiErr) {
    throw new Error(`Đã thu hồi on-chain (Tx: ${tx.hash}) nhưng chưa đồng bộ được MySQL: ${apiErr.message}`);
  }

  // Đồng bộ lại cache LocalStorage nếu có
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

// ============================================================================
// 9. TRA CỨU TOÀN BỘ CHỨNG CHỈ THEO ĐỊA CHỈ VÍ HỌC VIÊN (Không cần MetaMask)
// - B1: Gọi `contract.getCertificatesByStudent(walletAddress)` lấy danh sách Token ID sở hữu,
//       rồi gọi `getCertificateDetails(tid)` đọc chi tiết từng bằng trực tiếp từ Blockchain
// - B2: Bổ sung thêm dữ liệu từ Backend API `/public/wallet/:address` (nếu có) và gộp không trùng mã
// ============================================================================
export const getCertificatesByStudentWallet = async (walletAddress) => {
  if (!walletAddress || !ethers.isAddress(walletAddress.trim())) {
    throw new Error("Địa chỉ ví Ethereum không hợp lệ (cần 42 ký tự bắt đầu bằng 0x).");
  }
  const cleanAddress = ethers.getAddress(walletAddress.trim());
  const byCode = new Map(); // Dùng Map theo certificate_code để gộp kết quả không bị trùng

  // B1: Đọc trực tiếp toàn bộ Soulbound Certificate NFT từ Smart Contract (Read-Only RPC)
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

