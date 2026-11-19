/**
 * @file checkRoles.js
 * @author Thành viên 1 - Blockchain Engineer
 * @notice Script kiểm tra số dư ví và phân quyền RBAC (DEFAULT_ADMIN_ROLE, ISSUER_ROLE, REVOKER_ROLE)
 * @usage npx hardhat run scripts/checkRoles.js --network localhost
 *        npx hardhat run scripts/checkRoles.js --network sepolia
 */

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("======================================================================");
    console.log("🔍 KIỂM TRA PHÂN QUYỀN RBAC & SỐ DƯ VÍ - ENGLISH CERTIFICATE NFT");
    console.log("======================================================================");
    console.log(`🌐 Mạng đang kết nối: ${network.name.toUpperCase()} (Chain ID: ${network.config.chainId || "auto"})`);

    const signers = await ethers.getSigners();
    const [deployer] = signers;

    if (!deployer) {
        console.error("❌ Không tìm thấy tài khoản Signer nào được cấu hình!");
        process.exit(1);
    }

    const balanceWei = await ethers.provider.getBalance(deployer.address);
    const balanceEth = ethers.formatEther(balanceWei);

    console.log(`👤 Địa chỉ ví thực thi: ${deployer.address}`);
    console.log(`💰 Số dư ví hiện tại  : ${balanceEth} ETH`);

    // Đọc địa chỉ hợp đồng đã triển khai
    const addressPath = path.join(__dirname, "../artifacts-export/EnglishCertificateNFT-address.json");
    let contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress && fs.existsSync(addressPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(addressPath, "utf8"));
            contractAddress = data.address || data.contractAddress;
        } catch (e) {
            // bỏ qua lỗi đọc file
        }
    }

    if (!contractAddress) {
        console.warn("⚠️  Chưa tìm thấy địa chỉ contract trong artifacts-export hoặc file .env.");
        console.warn("👉 Vui lòng chạy 'npm run deploy:local' trước khi kiểm tra roles.");
        return;
    }

    console.log(`📜 Địa chỉ Smart Contract: ${contractAddress}`);

    // Kết nối tới Contract
    const EnglishCertificateNFT = await ethers.getContractFactory("EnglishCertificateNFT");
    const contract = EnglishCertificateNFT.attach(contractAddress);

    // Lấy Role Hashes
    const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
    const ISSUER_ROLE = await contract.ISSUER_ROLE();
    const REVOKER_ROLE = await contract.REVOKER_ROLE();

    console.log("\n📋 DANH SÁCH ROLE HASHES:");
    console.log(`   - DEFAULT_ADMIN_ROLE : ${DEFAULT_ADMIN_ROLE}`);
    console.log(`   - ISSUER_ROLE        : ${ISSUER_ROLE}`);
    console.log(`   - REVOKER_ROLE       : ${REVOKER_ROLE}`);

    // Kiểm tra quyền của Deployer
    const isAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    const isIssuer = await contract.hasRole(ISSUER_ROLE, deployer.address);
    const isRevoker = await contract.hasRole(REVOKER_ROLE, deployer.address);
    const issuerName = await contract.authorizedIssuerNames(deployer.address);

    console.log(`\n🛡️  KẾT QUẢ PHÂN QUYỀN VÍ ${deployer.address}:`);
    console.log(`   * Quyền Quản trị viên (Admin)   : ${isAdmin ? "✅ CÓ QUYỀN (GRANTED)" : "❌ KHÔNG CÓ"}`);
    console.log(`   * Quyền Cấp bằng (Issuer)       : ${isIssuer ? "✅ CÓ QUYỀN (GRANTED)" : "❌ KHÔNG CÓ"}`);
    console.log(`   * Quyền Thu hồi bằng (Revoker)  : ${isRevoker ? "✅ CÓ QUYỀN (GRANTED)" : "❌ KHÔNG CÓ"}`);
    console.log(`   * Đơn vị trực thuộc             : "${issuerName || "N/A"}"`);

    // Thống kê tổng số lượng chứng chỉ
    try {
        const total = await contract.totalIssued();
        console.log(`\n📊 Tổng số chứng chỉ đã cấp phát on-chain: ${total.toString()} chứng chỉ.`);
    } catch (e) {
        console.log(`\n📊 Tổng số chứng chỉ: Không thể đọc (Contract chưa có dữ liệu).`);
    }

    // Nếu trên mạng localhost, kiểm tra thêm một số ví mẫu
    if (network.name === "localhost" || network.name === "hardhat") {
        console.log("\n👥 KIỂM TRA MỘT SỐ VÍ THỬ NGHIỆM KHÁC:");
        for (let i = 1; i < Math.min(signers.length, 4); i++) {
            const acc = signers[i];
            const accIssuer = await contract.hasRole(ISSUER_ROLE, acc.address);
            const accRevoker = await contract.hasRole(REVOKER_ROLE, acc.address);
            console.log(`   Account #${i} (${acc.address}): Issuer=${accIssuer ? "✅" : "❌"} | Revoker=${accRevoker ? "✅" : "❌"}`);
        }
    }

    console.log("======================================================================");
    console.log("✨ KIỂM TRA PHÂN QUYỀN HOÀN TẤT THÀNH CÔNG!");
    console.log("======================================================================\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Lỗi khi thực thi checkRoles:", error);
        process.exit(1);
    });
