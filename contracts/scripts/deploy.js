const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { calculateCertificateHash, createCertificateMetadata } = require("./ipfsHelper");

async function main() {
  console.log("=================================================================");
  console.log("🚀 [TV1 - Blockchain Engineer] Bắt đầu triển khai Smart Contract");
  console.log("=================================================================");

  const [deployer, issuerStaff, student1, student2, student3] = await hre.ethers.getSigners();
  console.log("📍 Địa chỉ ví Deployer (Admin tối cao):", deployer.address);
  console.log("📍 Số dư tài khoản deployer:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  const initialIssuerName = "Cambridge & British English Academy (Vietnam)";
  const EnglishCertificateNFT = await hre.ethers.getContractFactory("EnglishCertificateNFT");
  const contract = await EnglishCertificateNFT.deploy(initialIssuerName);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log("✅ Hợp đồng EnglishCertificateNFT đã triển khai tại:", contractAddress);

  // Phân quyền cho cán bộ khảo thí / issuer phụ
  const ISSUER_ROLE = await contract.ISSUER_ROLE();
  await contract.registerIssuer(issuerStaff.address, "British Council Partner Center");
  console.log("✅ Đã cấp quyền ISSUER_ROLE cho cán bộ:", issuerStaff.address);

  // Cấp 3 chứng chỉ mẫu thực tế chuẩn IELTS, TOEIC, VSTEP
  console.log("\n📜 Đang khởi tạo các chứng chỉ mẫu trên blockchain...");

  const sampleCerts = [
    {
      recipient: student1.address,
      code: "ENG-2026-IELTS-001",
      name: "Nguyễn Văn An",
      studentCode: "HV-2026-001",
      courseCode: "IELTS-7.5",
      courseName: "IELTS Intensive Academic Preparation",
      score: "7.5 Overall (L: 8.0, R: 7.5, W: 7.0, S: 7.0)",
      ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800"
    },
    {
      recipient: student2.address,
      code: "ENG-2026-TOEIC-002",
      name: "Trần Thị Mai",
      studentCode: "HV-2026-002",
      courseCode: "TOEIC-850",
      courseName: "TOEIC Business Communication Master",
      score: "880/990 (Listening: 450, Reading: 430)",
      ipfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800"
    },
    {
      recipient: student3.address,
      code: "ENG-2026-VSTEP-003",
      name: "Lê Hoàng Vinh",
      studentCode: "HV-2026-003",
      courseCode: "VSTEP-B2",
      courseName: "Tiếng Anh Tổng Quát & VSTEP Bậc 4 (B2)",
      score: "Bậc 4 / B2 (7.5/10 - Đạt chuẩn đầu ra)",
      ipfsHash: "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800"
    }
  ];

  for (let i = 0; i < sampleCerts.length; i++) {
    const cert = sampleCerts[i];
    const hash = calculateCertificateHash({
      certificateCode: cert.code,
      recipientName: cert.name,
      studentCode: cert.studentCode,
      courseCode: cert.courseCode,
      score: cert.score,
      issuerName: initialIssuerName
    });

    const metadata = createCertificateMetadata({
      certificateCode: cert.code,
      recipientName: cert.name,
      studentCode: cert.studentCode,
      courseCode: cert.courseCode,
      courseName: cert.courseName,
      score: cert.score,
      issuerName: initialIssuerName,
      issueDate: Math.floor(Date.now() / 1000),
      imageIpfsUrl: cert.image
    });

    const tokenURI = `data:application/json;utf8,${encodeURIComponent(JSON.stringify(metadata))}`;

    const tx = await contract.issueCertificate(
      cert.recipient,
      cert.code,
      cert.name,
      cert.studentCode,
      cert.courseCode,
      cert.courseName,
      cert.score,
      0, // Vô thời hạn
      cert.ipfsHash,
      hash,
      tokenURI
    );
    await tx.wait();
    console.log(`  -> [Token #${i + 1}] Đã cấp thành công mã [${cert.code}] cho: ${cert.name} (${cert.recipient})`);
  }

  // Đọc ABI từ thư mục artifacts
  const artifactPath = path.join(__dirname, "../artifacts/contracts/EnglishCertificateNFT.sol/EnglishCertificateNFT.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const exportPayload = {
    contractName: "EnglishCertificateNFT",
    address: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployer: deployer.address,
    initialIssuerName: initialIssuerName,
    deployedAt: new Date().toISOString(),
    sampleAccounts: {
      admin: deployer.address,
      staff: issuerStaff.address,
      student1: { address: student1.address, name: "Nguyễn Văn An", certCode: "ENG-2026-IELTS-001" },
      student2: { address: student2.address, name: "Trần Thị Mai", certCode: "ENG-2026-TOEIC-002" },
      student3: { address: student3.address, name: "Lê Hoàng Vinh", certCode: "ENG-2026-VSTEP-003" }
    },
    abi: artifact.abi
  };

  // 1. Lưu vào thư mục artifacts-export nội bộ của contracts
  const exportDir = path.join(__dirname, "../artifacts-export");
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
  fs.writeFileSync(path.join(exportDir, "EnglishCertificateNFT.json"), JSON.stringify(exportPayload, null, 2));

  // 2. Tự động xuất sang thư mục backend/ (dành cho TV2)
  const backendContractsDir = path.join(__dirname, "../../backend/src/contracts");
  if (!fs.existsSync(backendContractsDir)) fs.mkdirSync(backendContractsDir, { recursive: true });
  fs.writeFileSync(path.join(backendContractsDir, "EnglishCertificateNFT.json"), JSON.stringify(exportPayload, null, 2));

  // 3. Tự động xuất sang thư mục frontend/ (dành cho TV3)
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) fs.mkdirSync(frontendContractsDir, { recursive: true });
  fs.writeFileSync(path.join(frontendContractsDir, "EnglishCertificateNFT.json"), JSON.stringify(exportPayload, null, 2));

  console.log("\n📁 Đã tự động đồng bộ ABI và địa chỉ Smart Contract sang:");
  console.log("   -> contracts/artifacts-export/EnglishCertificateNFT.json");
  console.log("   -> backend/src/contracts/EnglishCertificateNFT.json (cho TV2)");
  console.log("   -> frontend/src/contracts/EnglishCertificateNFT.json (cho TV3)");
  console.log("\n✨ Quá trình triển khai hoàn tất 100%!");
}

main().catch((error) => {
  console.error("❌ Lỗi khi triển khai:", error);
  process.exitCode = 1;
});
