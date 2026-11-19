const { expect } = require("chai");
const { ethers } = require("hardhat");
const { calculateCertificateHash } = require("../scripts/ipfsHelper");

describe("EnglishCertificateNFT (Soulbound Token Smart Contract)", function () {
  let contract;
  let admin, issuerStaff, revokerStaff, student1, student2, stranger;
  const initialIssuerName = "Cambridge & British English Academy";

  beforeEach(async function () {
    [admin, issuerStaff, revokerStaff, student1, student2, stranger] = await ethers.getSigners();

    const EnglishCertificateNFT = await ethers.getContractFactory("EnglishCertificateNFT");
    contract = await EnglishCertificateNFT.deploy(initialIssuerName);
    await contract.waitForDeployment();

    // Cấp quyền ISSUER_ROLE và REVOKER_ROLE cho các cán bộ khảo thí
    const ISSUER_ROLE = await contract.ISSUER_ROLE();
    const REVOKER_ROLE = await contract.REVOKER_ROLE();

    await contract.grantRole(ISSUER_ROLE, issuerStaff.address);
    await contract.grantRole(REVOKER_ROLE, revokerStaff.address);
    await contract.registerIssuer(issuerStaff.address, "British Council Test Center");
  });

  describe("1. Khởi tạo hợp đồng và Phân quyền (Roles)", function () {
    it("Khởi tạo đúng tên Token, Symbol và Đơn vị cấp ban đầu", async function () {
      expect(await contract.name()).to.equal("English Center Certificate NFT");
      expect(await contract.symbol()).to.equal("ENCERT");
      expect(await contract.authorizedIssuerNames(admin.address)).to.equal(initialIssuerName);
    });

    it("Admin có đầy đủ quyền DEFAULT_ADMIN_ROLE, ISSUER_ROLE, REVOKER_ROLE", async function () {
      const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
      const ISSUER_ROLE = await contract.ISSUER_ROLE();
      const REVOKER_ROLE = await contract.REVOKER_ROLE();

      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await contract.hasRole(ISSUER_ROLE, admin.address)).to.be.true;
      expect(await contract.hasRole(REVOKER_ROLE, admin.address)).to.be.true;
    });

    it("Người lạ không có quyền cấp chứng chỉ", async function () {
      const ISSUER_ROLE = await contract.ISSUER_ROLE();
      expect(await contract.hasRole(ISSUER_ROLE, stranger.address)).to.be.false;
    });
  });

  describe("2. Nghiệp vụ Cấp phát chứng chỉ (issueCertificate)", function () {
    const certCode = "ENG-2026-IELTS-001";
    const certData = {
      certificateCode: certCode,
      recipientName: "Nguyễn Văn An",
      studentCode: "HV-2026-001",
      courseCode: "IELTS-7.5",
      score: "7.5 Overall",
      issuerName: initialIssuerName
    };

    it("Cán bộ có quyền ISSUER_ROLE cấp chứng chỉ thành công", async function () {
      const certHash = calculateCertificateHash(certData);
      const tx = await contract.connect(issuerStaff).issueCertificate(
        student1.address,
        certCode,
        "Nguyễn Văn An",
        "HV-2026-001",
        "IELTS-7.5",
        "IELTS Intensive Academic",
        "7.5 Overall",
        0,
        "QmSampleIpfsHash",
        certHash,
        "https://api.jsonbin.io/cert/1"
      );

      await expect(tx).to.emit(contract, "CertificateIssued");

      expect(await contract.totalIssued()).to.equal(1);
      expect(await contract.ownerOf(1)).to.equal(student1.address);

      const cert = await contract.getCertificateDetails(1);
      expect(cert.certificateCode).to.equal(certCode);
      expect(cert.recipientName).to.equal("Nguyễn Văn An");
      expect(cert.studentCode).to.equal("HV-2026-001");
      expect(cert.score).to.equal("7.5 Overall");
      expect(cert.isRevoked).to.be.false;
    });

    it("Chặn người không có quyền cấp chứng chỉ", async function () {
      const certHash = calculateCertificateHash(certData);
      await expect(
        contract.connect(stranger).issueCertificate(
          student1.address,
          certCode,
          "Nguyễn Văn An",
          "HV-2026-001",
          "IELTS-7.5",
          "IELTS Intensive",
          "7.5 Overall",
          0,
          "QmSampleIpfsHash",
          certHash,
          "https://api.jsonbin.io/cert/1"
        )
      ).to.be.reverted;
    });

    it("Chặn cấp trùng mã chứng chỉ (Duplicate certificateCode)", async function () {
      const certHash1 = calculateCertificateHash(certData);
      await contract.connect(admin).issueCertificate(
        student1.address,
        certCode,
        "Nguyễn Văn An",
        "HV-2026-001",
        "IELTS-7.5",
        "IELTS Intensive",
        "7.5 Overall",
        0,
        "QmSampleIpfsHash",
        certHash1,
        "https://api.jsonbin.io/cert/1"
      );

      const certHash2 = ethers.keccak256(ethers.toUtf8Bytes("DIFFERENT_HASH"));
      await expect(
        contract.connect(admin).issueCertificate(
          student2.address,
          certCode, // Trùng mã
          "Trần Thị Mai",
          "HV-2026-002",
          "TOEIC-850",
          "TOEIC Master",
          "850 L&R",
          0,
          "QmSampleIpfsHash2",
          certHash2,
          "https://api.jsonbin.io/cert/2"
        )
      ).to.be.revertedWithCustomError(contract, "CertificateCodeAlreadyExists");
    });

    it("Chặn cấp trùng mã băm toàn vẹn (Duplicate certHash)", async function () {
      const certHash = calculateCertificateHash(certData);
      await contract.connect(admin).issueCertificate(
        student1.address,
        certCode,
        "Nguyễn Văn An",
        "HV-2026-001",
        "IELTS-7.5",
        "IELTS Intensive",
        "7.5 Overall",
        0,
        "QmSampleIpfsHash",
        certHash,
        "https://api.jsonbin.io/cert/1"
      );

      await expect(
        contract.connect(admin).issueCertificate(
          student2.address,
          "ENG-2026-TOEIC-999", // Mã khác
          "Trần Thị Mai",
          "HV-2026-002",
          "TOEIC-850",
          "TOEIC Master",
          "850 L&R",
          0,
          "QmSampleIpfsHash2",
          certHash, // Trùng Hash
          "https://api.jsonbin.io/cert/2"
        )
      ).to.be.revertedWithCustomError(contract, "CertificateHashAlreadyExists");
    });
  });

  describe("3. Cơ chế Soulbound Token (Non-Transferable)", function () {
    beforeEach(async function () {
      const certHash = ethers.keccak256(ethers.toUtf8Bytes("SOULBOUND_HASH_1"));
      await contract.connect(admin).issueCertificate(
        student1.address,
        "ENG-2026-SBT-001",
        "Lê Hoàng Vinh",
        "HV-2026-999",
        "VSTEP-B2",
        "Tiếng Anh VSTEP B2",
        "Bậc 4 / B2",
        0,
        "QmIpfsHash",
        certHash,
        "https://example.com/cert/sbt"
      );
    });

    it("Học viên KHÔNG THỂ chuyển nhượng chứng chỉ sang ví khác (transferFrom)", async function () {
      await expect(
        contract.connect(student1).transferFrom(student1.address, student2.address, 1)
      ).to.be.revertedWithCustomError(contract, "SoulboundTokenCannotBeTransferred");
    });

    it("Học viên KHÔNG THỂ safeTransferFrom sang ví khác", async function () {
      await expect(
        contract.connect(student1)["safeTransferFrom(address,address,uint256)"](
          student1.address,
          stranger.address,
          1
        )
      ).to.be.revertedWithCustomError(contract, "SoulboundTokenCannotBeTransferred");
    });

    it("Bên thứ ba được approve cũng KHÔNG THỂ chuyển nhượng", async function () {
      await contract.connect(student1).approve(stranger.address, 1);
      await expect(
        contract.connect(stranger).transferFrom(student1.address, stranger.address, 1)
      ).to.be.revertedWithCustomError(contract, "SoulboundTokenCannotBeTransferred");
    });
  });

  describe("4. Xác minh chứng chỉ công khai (Verification)", function () {
    const certCode = "ENG-2026-VERIFY-001";
    let certHash;

    beforeEach(async function () {
      certHash = ethers.keccak256(ethers.toUtf8Bytes("VERIFY_DATA_PACK"));
      await contract.connect(admin).issueCertificate(
        student1.address,
        certCode,
        "Đặng Thu Thảo",
        "HV-2026-777",
        "TOEIC-900",
        "TOEIC Advanced Communication",
        "920/990",
        0,
        "QmVerifyIpfs",
        certHash,
        "https://example.com/cert/verify"
      );
    });

    it("Xác minh bằng Token ID thành công", async function () {
      const [isValid, isRevoked, isExpired, cert] = await contract.verifyCertificate(1);
      expect(isValid).to.be.true;
      expect(isRevoked).to.be.false;
      expect(isExpired).to.be.false;
      expect(cert.recipientName).to.equal("Đặng Thu Thảo");
      expect(cert.certificateCode).to.equal(certCode);
    });

    it("Xác minh bằng Mã chứng chỉ (certificateCode) thành công", async function () {
      const [exists, tokenId, isValid, cert] = await contract.verifyByCertificateCode(certCode);
      expect(exists).to.be.true;
      expect(tokenId).to.equal(1);
      expect(isValid).to.be.true;
      expect(cert.recipientName).to.equal("Đặng Thu Thảo");
    });

    it("Xác minh bằng Mã băm toàn vẹn (certHash) thành công", async function () {
      const [exists, tokenId, isValid] = await contract.verifyByHash(certHash);
      expect(exists).to.be.true;
      expect(tokenId).to.equal(1);
      expect(isValid).to.be.true;
    });

    it("Tra cứu mã không tồn tại trả về exists = false", async function () {
      const [exists, tokenId, isValid] = await contract.verifyByCertificateCode("NON_EXISTING_CODE");
      expect(exists).to.be.false;
      expect(tokenId).to.equal(0);
      expect(isValid).to.be.false;
    });
  });

  describe("5. Thu hồi chứng chỉ (Revocation)", function () {
    beforeEach(async function () {
      const certHash = ethers.keccak256(ethers.toUtf8Bytes("FRAUD_STUDENT_CERT"));
      await contract.connect(admin).issueCertificate(
        student1.address,
        "ENG-2026-FRAUD-001",
        "Vũ Gian Lận",
        "HV-2026-000",
        "IELTS-8.0",
        "IELTS Intensive",
        "8.5 Overall",
        0,
        "QmFraudIpfs",
        certHash,
        "https://example.com/cert/fraud"
      );
    });

    it("Cán bộ có quyền REVOKER_ROLE thu hồi chứng chỉ thành công", async function () {
      const reason = "Phát hiện thí sinh nhờ thi hộ trong kỳ thi ngày 20/10";
      const tx = await contract.connect(revokerStaff).revokeCertificate(1, reason);

      await expect(tx).to.emit(contract, "CertificateRevoked");

      const [isValid, isRevoked, , cert] = await contract.verifyCertificate(1);
      expect(isValid).to.be.false;
      expect(isRevoked).to.be.true;
      expect(cert.revokeReason).to.equal(reason);
    });

    it("Người không có quyền không thể thu hồi chứng chỉ", async function () {
      await expect(
        contract.connect(stranger).revokeCertificate(1, "Lý do bất kỳ")
      ).to.be.reverted;
    });

    it("Không thể thu hồi một chứng chỉ đã bị thu hồi trước đó", async function () {
      await contract.connect(revokerStaff).revokeCertificate(1, "Lần 1");
      await expect(
        contract.connect(revokerStaff).revokeCertificate(1, "Lần 2")
      ).to.be.revertedWithCustomError(contract, "CertificateAlreadyRevoked");
    });
  });

  describe("6. Cấp chứng chỉ hàng loạt (batchIssueCertificates)", function () {
    it("Cấp đồng thời danh sách học viên trong một lớp", async function () {
      const recipients = [student1.address, student2.address];
      const codes = ["ENG-BATCH-001", "ENG-BATCH-002"];
      const names = ["Học Viên 1", "Học Viên 2"];
      const studentCodes = ["HV-B-01", "HV-B-02"];
      const scores = ["8.0 Overall", "7.5 Overall"];
      const ipfsHashes = ["QmHash1", "QmHash2"];
      const hashes = [
        ethers.keccak256(ethers.toUtf8Bytes("HASH_B_1")),
        ethers.keccak256(ethers.toUtf8Bytes("HASH_B_2"))
      ];
      const uris = ["https://cert/1", "https://cert/2"];

      const tokenIds = await contract.connect(admin).batchIssueCertificates.staticCall(
        recipients,
        codes,
        names,
        studentCodes,
        "IELTS-CLASS-A",
        "IELTS Masterclass Group A",
        scores,
        0,
        ipfsHashes,
        hashes,
        uris
      );

      expect(tokenIds.length).to.equal(2);
      expect(tokenIds[0]).to.equal(1);
      expect(tokenIds[1]).to.equal(2);

      await contract.connect(admin).batchIssueCertificates(
        recipients,
        codes,
        names,
        studentCodes,
        "IELTS-CLASS-A",
        "IELTS Masterclass Group A",
        scores,
        0,
        ipfsHashes,
        hashes,
        uris
      );

      expect(await contract.totalIssued()).to.equal(2);
      expect(await contract.ownerOf(1)).to.equal(student1.address);
      expect(await contract.ownerOf(2)).to.equal(student2.address);
    });

    it("Báo lỗi nếu số lượng phần tử các mảng không khớp nhau", async function () {
      await expect(
        contract.connect(admin).batchIssueCertificates(
          [student1.address],
          ["ENG-BATCH-001", "ENG-BATCH-002"], // Lệch độ dài mảng
          ["Học Viên 1"],
          ["HV-01"],
          "IELTS",
          "IELTS Course",
          ["8.0"],
          0,
          ["Qm1"],
          [ethers.keccak256(ethers.toUtf8Bytes("H1"))],
          ["uri1"]
        )
      ).to.be.revertedWithCustomError(contract, "BatchArrayLengthMismatch");
    });
  });

  describe("7. Truy vấn chứng chỉ theo Học viên (getCertificatesByStudent)", function () {
    it("Trả về đầy đủ các chứng chỉ một học viên đã đạt được", async function () {
      const h1 = ethers.keccak256(ethers.toUtf8Bytes("H1"));
      const h2 = ethers.keccak256(ethers.toUtf8Bytes("H2"));

      await contract.connect(admin).issueCertificate(
        student1.address,
        "ENG-C1",
        "Nguyễn Văn An",
        "HV-01",
        "TOEIC",
        "TOEIC 500",
        "550",
        0,
        "Qm1",
        h1,
        "uri1"
      );

      await contract.connect(admin).issueCertificate(
        student1.address,
        "ENG-C2",
        "Nguyễn Văn An",
        "HV-01",
        "IELTS",
        "IELTS 6.5",
        "6.5",
        0,
        "Qm2",
        h2,
        "uri2"
      );

      const tokenIds = await contract.getCertificatesByStudent(student1.address);
      expect(tokenIds.length).to.equal(2);
      expect(tokenIds[0]).to.equal(1);
      expect(tokenIds[1]).to.equal(2);
    });
  });
});
