const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnglishCertificateNFT - Gas Consumption & Scalability Benchmarks", function () {
    let contract;
    let owner;
    let issuer;
    let revoker;
    let students;

    const sampleCertHash = ethers.keccak256(ethers.toUtf8Bytes("GAS_TEST_CERT_HASH_001"));

    beforeEach(async function () {
        const signers = await ethers.getSigners();
        owner = signers[0];
        issuer = signers[1];
        revoker = signers[2];
        students = signers.slice(3, 15);

        const Factory = await ethers.getContractFactory("EnglishCertificateNFT");
        contract = await Factory.deploy("Koheni English Academy International");
        await contract.waitForDeployment();

        // Cấp quyền ISSUER và REVOKER
        const ISSUER_ROLE = await contract.ISSUER_ROLE();
        const REVOKER_ROLE = await contract.REVOKER_ROLE();
        await contract.grantRole(ISSUER_ROLE, issuer.address);
        await contract.grantRole(REVOKER_ROLE, revoker.address);
    });

    it("1. Đo lường Gas triển khai Hợp đồng (Contract Deployment)", async function () {
        const Factory = await ethers.getContractFactory("EnglishCertificateNFT");
        const deployTx = await Factory.getDeployTransaction("Koheni English Academy");
        const estimatedGas = await ethers.provider.estimateGas(deployTx);

        console.log(`\n      ⛽ Deployment Gas ước lượng: ${estimatedGas.toLocaleString()} gas`);
        expect(estimatedGas).to.be.lessThan(5000000n);
    });

    it("2. Đo lường Gas khi cấp mới 01 chứng chỉ đơn lẻ (Single issueCertificate)", async function () {
        const recipient = students[0].address;
        const certCode = "ENG-2026-IELTS-GAS-01";
        const certHash = ethers.keccak256(ethers.toUtf8Bytes(certCode));

        const tx = await contract.connect(issuer).issueCertificate(
            recipient,
            certCode,
            "Nguyen Van An",
            "HV-2026-GAS01",
            "IELTS-7.5",
            "IELTS Advanced Master",
            "7.5 Overall",
            Math.floor(Date.now() / 1000) + 63072000,
            "QmZtmD2qt8fJv3CLdHmeSZxgED2eyCHJLB451ED4545GAS",
            certHash,
            "ipfs://QmZtmD2qt8fJv3CLdHmeSZxgED2eyCHJLB451ED4545GAS"
        );

        const receipt = await tx.wait();
        console.log(`      ⛽ Gas cấp 01 chứng chỉ đơn lẻ: ${receipt.gasUsed.toLocaleString()} gas`);

        // Giới hạn an toàn cho ERC-721 + Full Struct Storage (15 fields) + 3 Mappings
        expect(receipt.gasUsed).to.be.lessThan(750000n);
    });

    it("3. Đo lường & So sánh hiệu quả Gas của cấp hàng loạt (Batch Minting)", async function () {
        const batchSize = 5;
        const recipients = [];
        const certCodes = [];
        const names = [];
        const studentCodes = [];
        const scores = [];
        const ipfsHashes = [];
        const certHashes = [];
        const tokenURIs = [];

        for (let i = 0; i < batchSize; i++) {
            recipients.push(students[i].address);
            const code = `ENG-2026-BATCH-${i + 1}`;
            certCodes.push(code);
            names.push(`Học viên Lớp A #${i + 1}`);
            studentCodes.push(`HV-BATCH-${i + 1}`);
            scores.push("8.0 Overall");
            ipfsHashes.push(`QmBatchHashIPFS000000000000000000000000000${i}`);
            certHashes.push(ethers.keccak256(ethers.toUtf8Bytes(code)));
            tokenURIs.push(`ipfs://QmBatchHashIPFS000000000000000000000000000${i}`);
        }

        const txBatch = await contract.connect(issuer).batchIssueCertificates(
            recipients,
            certCodes,
            names,
            studentCodes,
            "IELTS-8.0",
            "IELTS Intensive Fast-track",
            scores,
            Math.floor(Date.now() / 1000) + 63072000,
            ipfsHashes,
            certHashes,
            tokenURIs
        );

        const receiptBatch = await txBatch.wait();
        const totalGas = receiptBatch.gasUsed;
        const gasPerCert = totalGas / BigInt(batchSize);

        console.log(`      ⛽ Tổng Gas cấp loạt ${batchSize} chứng chỉ : ${totalGas.toLocaleString()} gas`);
        console.log(`      ⚡ Gas trung bình cho mỗi chứng chỉ : ${gasPerCert.toLocaleString()} gas`);

        // Batch mint tiết kiệm chi phí base transaction overhead (21,000 gas mỗi tx)
        expect(gasPerCert).to.be.lessThan(650000n);
    });

    it("4. Đo lường Gas khi thực hiện Thu hồi chứng chỉ (Revocation)", async function () {
        // Cấp 1 chứng chỉ trước
        const certCode = "ENG-2026-REVOKE-TEST";
        const certHash = ethers.keccak256(ethers.toUtf8Bytes(certCode));
        await contract.connect(issuer).issueCertificate(
            students[0].address,
            certCode,
            "Tran Van Fraud",
            "HV-FRAUD-01",
            "TOEIC-850",
            "TOEIC 4 Skills",
            "850",
            0,
            "QmHashDummy",
            certHash,
            "ipfs://QmHashDummy"
        );

        const txRevoke = await contract.connect(revoker).revokeCertificate(
            1,
            "Phat hien gian lan phong thi theo quyet dinh so 108/QD-HDKL"
        );
        const receiptRevoke = await txRevoke.wait();

        console.log(`      ⛽ Gas thực hiện thu hồi chứng chỉ: ${receiptRevoke.gasUsed.toLocaleString()} gas`);
        expect(receiptRevoke.gasUsed).to.be.lessThan(150000n);
    });

    it("5. Hàm xác minh (verifyByCertificateCode / verifyByHash) không tốn gas từ ngoài", async function () {
        const certCode = "ENG-2026-VIEW-TEST";
        const certHash = ethers.keccak256(ethers.toUtf8Bytes(certCode));
        await contract.connect(issuer).issueCertificate(
            students[0].address,
            certCode,
            "Le Thi Hoa",
            "HV-VIEW-01",
            "VSTEP-B2",
            "VSTEP Master B2",
            "B2 (7.0)",
            0,
            "QmHashView",
            certHash,
            "ipfs://QmHashView"
        );

        const resultByCode = await contract.verifyByCertificateCode(certCode);
        const resultByHash = await contract.verifyByHash(certHash);

        expect(resultByCode.exists).to.equal(true);
        expect(resultByCode.isValid).to.equal(true);
        expect(resultByHash.exists).to.equal(true);
        expect(resultByHash.cert.recipientName).to.equal("Le Thi Hoa");
    });
});
