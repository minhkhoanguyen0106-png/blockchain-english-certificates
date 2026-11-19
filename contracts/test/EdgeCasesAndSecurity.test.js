const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnglishCertificateNFT - Edge Cases & Security Audit Test Suite", function () {
    let contract;
    let owner;
    let issuer;
    let revoker;
    let attacker;
    let studentA;
    let studentB;

    beforeEach(async function () {
        const signers = await ethers.getSigners();
        owner = signers[0];
        issuer = signers[1];
        revoker = signers[2];
        attacker = signers[3];
        studentA = signers[4];
        studentB = signers[5];

        const Factory = await ethers.getContractFactory("EnglishCertificateNFT");
        contract = await Factory.deploy("Koheni English Academy Security Test");
        await contract.waitForDeployment();

        const ISSUER_ROLE = await contract.ISSUER_ROLE();
        const REVOKER_ROLE = await contract.REVOKER_ROLE();
        await contract.grantRole(ISSUER_ROLE, issuer.address);
        await contract.grantRole(REVOKER_ROLE, revoker.address);
    });

    describe("1. Kiểm tra xác thực đầu vào (Input Validation & Zero Address)", function () {
        it("Chặn cấp bằng cho địa chỉ ví 0x0 (Zero Address)", async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("ZERO_ADDR_TEST"));
            await expect(
                contract.connect(issuer).issueCertificate(
                    ethers.ZeroAddress,
                    "ENG-2026-ZERO",
                    "Nguyen Van A",
                    "HV-001",
                    "IELTS-7.0",
                    "IELTS",
                    "7.0",
                    0,
                    "QmHash",
                    hash,
                    "ipfs://QmHash"
                )
            ).to.be.revertedWithCustomError(contract, "InvalidRecipientAddress");
        });

        it("Chặn cấp bằng khi certificateCode hoặc recipientName bị rỗng", async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("EMPTY_TEST"));
            // Mã rỗng
            await expect(
                contract.connect(issuer).issueCertificate(
                    studentA.address,
                    "",
                    "Nguyen Van A",
                    "HV-001",
                    "IELTS-7.0",
                    "IELTS",
                    "7.0",
                    0,
                    "QmHash",
                    hash,
                    "ipfs://QmHash"
                )
            ).to.be.revertedWithCustomError(contract, "InvalidInputData");

            // Tên học viên rỗng
            await expect(
                contract.connect(issuer).issueCertificate(
                    studentA.address,
                    "ENG-2026-TEST",
                    "",
                    "HV-001",
                    "IELTS-7.0",
                    "IELTS",
                    "7.0",
                    0,
                    "QmHash",
                    hash,
                    "ipfs://QmHash"
                )
            ).to.be.revertedWithCustomError(contract, "InvalidInputData");
        });

        it("Chặn đăng ký Issuer với địa chỉ 0x0 hoặc tên trung tâm rỗng", async function () {
            await expect(
                contract.connect(owner).registerIssuer(ethers.ZeroAddress, "Center Name")
            ).to.be.revertedWithCustomError(contract, "InvalidRecipientAddress");

            await expect(
                contract.connect(owner).registerIssuer(studentA.address, "")
            ).to.be.revertedWithCustomError(contract, "InvalidInputData");
        });
    });

    describe("2. Chống chuyển nhượng Soulbound Token (Anti-Transfer Security)", function () {
        let tokenId;

        beforeEach(async function () {
            const hash = ethers.keccak256(ethers.toUtf8Bytes("SBT_SECURITY_TEST"));
            const tx = await contract.connect(issuer).issueCertificate(
                studentA.address,
                "ENG-2026-SBT-SEC",
                "Nguyen Van A",
                "HV-001",
                "TOEIC-900",
                "TOEIC",
                "900",
                0,
                "QmHashSBT",
                hash,
                "ipfs://QmHashSBT"
            );
            await tx.wait();
            tokenId = 1;
        });

        it("Học viên không thể gọi transferFrom sang ví khác", async function () {
            await expect(
                contract.connect(studentA).transferFrom(studentA.address, studentB.address, tokenId)
            ).to.be.revertedWithCustomError(contract, "SoulboundTokenCannotBeTransferred");
        });

        it("Học viên không thể gọi safeTransferFrom sang ví khác", async function () {
            await expect(
                contract.connect(studentA)["safeTransferFrom(address,address,uint256)"](
                    studentA.address,
                    studentB.address,
                    tokenId
                )
            ).to.be.revertedWithCustomError(contract, "SoulboundTokenCannotBeTransferred");
        });

        it("Người thứ ba dù được approve cũng không thể chuyển chứng chỉ", async function () {
            // Học viên thử approve cho attacker
            await contract.connect(studentA).approve(attacker.address, tokenId);

            // Attacker cố tình chuyển nhượng
            await expect(
                contract.connect(attacker).transferFrom(studentA.address, attacker.address, tokenId)
            ).to.be.revertedWithCustomError(contract, "SoulboundTokenCannotBeTransferred");
        });
    });

    describe("3. Kiểm tra logic Thu hồi & Trạng thái hết hạn (Revocation & Expiration)", function () {
        let tokenId;
        const certCode = "ENG-2026-EXPIRY-TEST";
        const hash = ethers.keccak256(ethers.toUtf8Bytes(certCode));

        it("Chặn thu hồi chứng chỉ không tồn tại (CertificateNotFound)", async function () {
            await expect(
                contract.connect(revoker).revokeCertificate(9999, "Lý do khống")
            ).to.be.revertedWithCustomError(contract, "CertificateNotFound");
        });

        it("Chặn thu hồi lặp lại một chứng chỉ đã bị hủy (CertificateAlreadyRevoked)", async function () {
            await contract.connect(issuer).issueCertificate(
                studentA.address,
                certCode,
                "Tran Thi B",
                "HV-002",
                "IELTS-6.5",
                "IELTS",
                "6.5",
                0,
                "QmHash",
                hash,
                "ipfs://QmHash"
            );
            tokenId = 1;

            // Thu hồi lần 1
            await contract.connect(revoker).revokeCertificate(tokenId, "Vi phạm quy chế thi");

            // Thu hồi lần 2 phải bị chặn
            await expect(
                contract.connect(revoker).revokeCertificate(tokenId, "Thu hồi lần 2")
            ).to.be.revertedWithCustomError(contract, "CertificateAlreadyRevoked");
        });

        it("Xác minh trạng thái chứng chỉ đã hết hạn (Expired Certificate)", async function () {
            // Cấp chứng chỉ với hạn đã qua (quá khứ)
            const pastTimestamp = 100000;
            const expCode = "ENG-EXPIRED-001";
            const expHash = ethers.keccak256(ethers.toUtf8Bytes(expCode));

            await contract.connect(issuer).issueCertificate(
                studentA.address,
                expCode,
                "Le Van C",
                "HV-003",
                "TOEIC-600",
                "TOEIC",
                "600",
                pastTimestamp,
                "QmHashExp",
                expHash,
                "ipfs://QmHashExp"
            );

            const verification = await contract.verifyByCertificateCode(expCode);
            expect(verification.exists).to.equal(true);
            expect(verification.isValid).to.equal(false); // Hết hạn -> không còn hợp lệ
        });
    });

    describe("4. Kiểm thử Cấp bằng hàng loạt & Truy vấn danh sách", function () {
        it("Chặn batchIssueCertificates khi độ dài mảng dữ liệu không đồng nhất", async function () {
            await expect(
                contract.connect(issuer).batchIssueCertificates(
                    [studentA.address, studentB.address], // 2 học viên
                    ["CODE-1"],                          // 1 mã chứng chỉ (Lệch)
                    ["Ten 1", "Ten 2"],
                    ["HV-1", "HV-2"],
                    "IELTS-7.0",
                    "IELTS",
                    ["7.0", "7.0"],
                    0,
                    ["Qm1", "Qm2"],
                    [ethers.ZeroHash, ethers.ZeroHash],
                    ["uri1", "uri2"]
                )
            ).to.be.revertedWithCustomError(contract, "BatchArrayLengthMismatch");
        });

        it("Truy vấn sinh viên chưa có bằng trả về mảng rỗng và totalIssued tính chính xác", async function () {
            const certs = await contract.getCertificatesByStudent(attacker.address);
            expect(certs.length).to.equal(0);

            const allTokens = await contract.getAllTokenIds();
            const total = await contract.totalIssued();
            expect(allTokens.length).to.equal(Number(total));
        });
    });
});
