const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const { ethers } = require("hardhat");
require("dotenv").config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

/**
 * Tính toán mã băm Keccak-256 để bảo vệ tính toàn vẹn của chứng chỉ
 * @param {Object} certData Dữ liệu cốt lõi của chứng chỉ
 * @returns {string} Bytes32 hex string
 */
function calculateCertificateHash(certData) {
  const packedData = ethers.solidityPacked(
    ["string", "string", "string", "string", "string", "string"],
    [
      certData.certificateCode,
      certData.recipientName,
      certData.studentCode,
      certData.courseCode,
      certData.score,
      certData.issuerName
    ]
  );
  return ethers.keccak256(packedData);
}

/**
 * Tạo chuẩn Metadata ERC-721 cho Chứng chỉ tiếng Anh
 * @param {Object} data 
 * @returns {Object} Metadata object
 */
function createCertificateMetadata(data) {
  return {
    name: `English Certificate: ${data.courseName} - ${data.recipientName}`,
    description: `Chứng chỉ hoàn thành khóa học tiếng Anh cấp bởi ${data.issuerName}. Chứng chỉ được bảo chứng tính toàn vẹn bằng công nghệ Soulbound NFT trên Blockchain.`,
    image: data.imageIpfsUrl || "ipfs://QmDefaultCertificateTemplateHash",
    external_url: `https://cert.englishcenter.edu.vn/verify/${data.certificateCode}`,
    attributes: [
      { trait_type: "Recipient Name", value: data.recipientName },
      { trait_type: "Student Code", value: data.studentCode },
      { trait_type: "Course Code", value: data.courseCode },
      { trait_type: "Course Name", value: data.courseName },
      { trait_type: "Score / Grade", value: data.score },
      { trait_type: "Issuer", value: data.issuerName },
      { trait_type: "Certificate Code", value: data.certificateCode },
      { trait_type: "Issue Date", value: new Date(data.issueDate * 1000).toLocaleDateString("vi-VN") },
      { trait_type: "Soulbound Token", value: "Non-Transferable" }
    ]
  };
}

/**
 * Tải file (ảnh phôi bằng hoặc PDF) lên IPFS thông qua Pinata
 * @param {string} filePath Đường dẫn file trên ổ cứng
 * @returns {Promise<string>} IPFS CID (Hash)
 */
async function uploadFileToPinata(filePath) {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.warn("⚠️ Pinata API Key chưa được cấu hình. Sử dụng mock IPFS Hash giả lập để test.");
    return `Qm${ethers.keccak256(ethers.toUtf8Bytes(filePath)).slice(2, 48)}`;
  }

  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));

  const res = await axios.post(url, data, {
    maxBodyLength: "Infinity",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_KEY,
    },
  });

  return res.data.IpfsHash;
}

/**
 * Tải Metadata JSON lên IPFS thông qua Pinata
 * @param {Object} metadata JSON metadata của chứng chỉ
 * @returns {Promise<string>} IPFS URI (ipfs://CID)
 */
async function uploadMetadataToPinata(metadata) {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.warn("⚠️ Pinata API Key chưa được cấu hình. Sử dụng mock IPFS URI giả lập để test.");
    const mockHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(metadata))).slice(2, 48);
    return `ipfs://Qm${mockHash}`;
  }

  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
  const res = await axios.post(
    url,
    {
      pinataContent: metadata,
      pinataMetadata: {
        name: `Cert-${metadata.attributes.find((a) => a.trait_type === "Certificate Code")?.value || "Metadata"}`,
      },
    },
    {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    }
  );

  return `ipfs://${res.data.IpfsHash}`;
}

module.exports = {
  calculateCertificateHash,
  createCertificateMetadata,
  uploadFileToPinata,
  uploadMetadataToPinata,
  PINATA_GATEWAY
};
