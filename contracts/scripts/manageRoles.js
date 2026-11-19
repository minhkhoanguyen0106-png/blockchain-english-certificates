/**
 * @file manageRoles.js
 * @author Thành viên 1 - Blockchain Engineer
 * @notice Script phân quyền và quản lý cán bộ cấp / thu hồi chứng chỉ (AccessControl)
 * @usage npx hardhat run scripts/manageRoles.js --network localhost
 *        npx hardhat run scripts/manageRoles.js --network sepolia
 */

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("======================================================================");
    console.log("⚙️  QUẢN LÝ PHÂN QUYỀN TRUNG TÂM / CÁN BỘ - ACCESS CONTROL MANAGER");
    console.log("======================================================================");
    console.log(`🌐 Mạng đang kết nối: ${network.name.toUpperCase()}`);

    const [admin, newOfficer] = await ethers.getSigners();
    console.log(`🔑 Admin thực thi: ${admin.address}`);

    const addressPath = path.join(__dirname, "../artifacts-export/EnglishCertificateNFT-address.json");
    let contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress && fs.existsSync(addressPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(addressPath, "utf8"));
            contractAddress = data.address || data.contractAddress;
        } catch (e) {}
    }

    if (!contractAddress) {
        console.log("⚠️  Không tìm thấy địa chỉ contract đã deploy. Thực hiện demo deploy tạm thời để kiểm thử...");
        const Factory = await ethers.getContractFactory("EnglishCertificateNFT");
        const demoContract = await Factory.deploy("Koheni English Academy (Main Campus)");
        await demoContract.waitForDeployment();
        contractAddress = await demoContract.getAddress();
        console.log(`✅ Đã khởi tạo Contract demo tại: ${contractAddress}`);
    }

    const EnglishCertificateNFT = await ethers.getContractFactory("EnglishCertificateNFT");
    const contract = EnglishCertificateNFT.attach(contractAddress);

    // Thông tin cơ sở / cán bộ cần cấp quyền
    const targetAddress = process.env.TARGET_OFFICER_ADDRESS || (newOfficer ? newOfficer.address : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    const centerBranchName = process.env.TARGET_CENTER_NAME || "Koheni Language Center - Chi Nhánh Cần Thơ";

    console.log(`\n🏢 Cán bộ / Chi nhánh mục tiêu: ${targetAddress}`);
    console.log(`🏷️  Tên cơ sở đăng ký: "${centerBranchName}"`);

    // 1. Kiểm tra trạng thái hiện tại
    const ISSUER_ROLE = await contract.ISSUER_ROLE();
    const alreadyIssuer = await contract.hasRole(ISSUER_ROLE, targetAddress);

    if (alreadyIssuer) {
        console.log("ℹ️  Tài khoản này ĐÃ CÓ QUYỀN ISSUER_ROLE từ trước.");
    } else {
        console.log("🚀 Đang gửi giao dịch đăng ký quyền ISSUER_ROLE...");
        const tx = await contract.registerIssuer(targetAddress, centerBranchName);
        console.log(`⏳ Đang xác nhận giao dịch: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ Đăng ký thành công tại Block #${receipt.blockNumber} (Gas tiêu thụ: ${receipt.gasUsed.toString()})`);
    }

    // 2. Cấp thêm quyền REVOKER_ROLE nếu được yêu cầu
    const REVOKER_ROLE = await contract.REVOKER_ROLE();
    const isRevoker = await contract.hasRole(REVOKER_ROLE, targetAddress);
    if (!isRevoker) {
        console.log("🚀 Đang cấp thêm quyền REVOKER_ROLE (Hội đồng kỷ luật/Thu hồi)...");
        const txRevoke = await contract.grantRole(REVOKER_ROLE, targetAddress);
        await txRevoke.wait();
        console.log("✅ Đã cấp REVOKER_ROLE thành công!");
    }

    // 3. Xác thực lại
    const updatedIssuerName = await contract.authorizedIssuerNames(targetAddress);
    console.log("\n📋 KẾT QUẢ CẬP NHẬT:");
    console.log(`   - Địa chỉ: ${targetAddress}`);
    console.log(`   - Quyền ISSUER : ${await contract.hasRole(ISSUER_ROLE, targetAddress) ? "✅ CÓ" : "❌ KHÔNG"}`);
    console.log(`   - Quyền REVOKER: ${await contract.hasRole(REVOKER_ROLE, targetAddress) ? "✅ CÓ" : "❌ KHÔNG"}`);
    console.log(`   - Tên cơ sở   : "${updatedIssuerName}"`);
    console.log("======================================================================\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Lỗi khi thực thi manageRoles:", error);
        process.exit(1);
    });
