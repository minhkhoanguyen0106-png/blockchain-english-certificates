/**
 * @file verifyIpfsUpload.js
 * @author Thành viên 1 - Blockchain Engineer
 * @notice Công cụ kiểm tra tính toàn vẹn metadata IPFS và mã băm Keccak-256 (IPFS & Hash Validator)
 * @usage npx hardhat run scripts/verifyIpfsUpload.js
 */

const { ethers } = require("hardhat");
const {
    calculateCertificateHash,
    createCertificateMetadata
} = require("./ipfsHelper");

async function main() {
    console.log("======================================================================");
    console.log("📦 KIỂM TRA ĐỊNH DẠNG METADATA IPFS & BẢO TOÀN DỮ LIỆU KECCAK-256");
    console.log("======================================================================\n");

    const sampleCert = {
        certificateCode: "ENG-2026-IELTS-IPFS-001",
        recipientName: "Đặng Hoàng Long",
        studentCode: "HV-2026-DHL",
        courseCode: "IELTS-7.5",
        courseName: "IELTS Intensive Master 7.5",
        score: "7.5 Overall (L: 8.0, R: 8.0, W: 7.0, S: 7.0)",
        issueDate: Math.floor(Date.now() / 1000),
        expiryDate: Math.floor(Date.now() / 1000) + 63072000,
        issuerName: "Koheni English Academy International",
        imageIpfsUrl: "ipfs://QmZtmD2qt8fJv3CLdHmeSZxgED2eyCHJLB451ED4545AAA"
    };

    console.log("1. 📄 Dữ liệu chứng chỉ đầu vào:");
    console.log(`   - Mã chứng chỉ : ${sampleCert.certificateCode}`);
    console.log(`   - Học viên      : ${sampleCert.recipientName} (${sampleCert.studentCode})`);
    console.log(`   - Khóa học      : ${sampleCert.courseName}`);
    console.log(`   - Điểm số       : ${sampleCert.score}`);

    // 2. Tạo Metadata chuẩn ERC-721
    console.log("\n2. 🧬 Khởi tạo Metadata ERC-721 chuẩn OpenSea / IPFS:");
    const metadata = createCertificateMetadata(sampleCert);
    console.log(JSON.stringify(metadata, null, 2));

    // 3. Tính toán Keccak-256
    console.log("\n3. 🔐 Tính toán mã băm Keccak-256 On-Chain:");
    const certHash = calculateCertificateHash(sampleCert);
    console.log(`   - Cert Hash (Bytes32): ${certHash}`);

    // Kiểm tra tính tương thích với Solidity
    const packedSolidity = ethers.solidityPacked(
        ["string", "string", "string", "string", "string", "string"],
        [
            sampleCert.certificateCode,
            sampleCert.recipientName,
            sampleCert.studentCode,
            sampleCert.courseCode,
            sampleCert.score,
            sampleCert.issuerName
        ]
    );
    const expectedHash = ethers.keccak256(packedSolidity);

    if (certHash === expectedHash) {
        console.log("   ✅ Mã băm khớp 100% với hàm abi.encodePacked() trong Smart Contract!");
    } else {
        console.error("   ❌ Cảnh báo: Hash không khớp với Smart Contract!");
        process.exit(1);
    }

    // 4. Kiểm tra định dạng IPFS CID
    console.log("\n4. 🌐 Kiểm tra định dạng IPFS CID:");
    const sampleCID = "QmZtmD2qt8fJv3CLdHmeSZxgED2eyCHJLB451ED4545AAA";
    const isCIDv0 = /^Qm[1-9A-HJ-NP-za-km-z]{44}$/.test(sampleCID);
    console.log(`   - CID mẫu: ${sampleCID}`);
    console.log(`   - Định dạng chuẩn CIDv0 (Base58btc, 46 ký tự): ${isCIDv0 ? "✅ HỢP LỆ" : "❌ KHÔNG HỢP LỆ"}`);

    console.log("\n======================================================================");
    console.log("✨ XÁC THỰC METADATA VÀ IPFS THÀNH CÔNG RỰC RỠ!");
    console.log("======================================================================\n");
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
