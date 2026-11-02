// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EnglishCertificateNFT
 * @author Thành viên 1 - Blockchain Engineer
 * @notice Hợp đồng thông minh Soulbound Token (ERC-721 Non-Transferable)
 *         Quản lý, Cấp phát và Xác thực chứng chỉ trung tâm tiếng Anh trên Blockchain.
 * @dev Kế thừa ERC721URIStorage, AccessControl, Ownable từ OpenZeppelin v5.
 */
contract EnglishCertificateNFT is ERC721URIStorage, AccessControl, Ownable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");

    uint256 private _nextTokenId;

    enum CertificateStatus {
        ACTIVE,     // Chứng chỉ hợp lệ
        REVOKED,    // Chứng chỉ đã bị thu hồi (gian lận/sai sót)
        EXPIRED     // Chứng chỉ đã hết hạn
    }

    struct Certificate {
        uint256 tokenId;
        string certificateCode; // Mã chứng chỉ hiển thị (VD: CERT-2026-IELTS-001)
        string recipientName;   // Họ và tên học viên
        string studentCode;     // Mã học viên (VD: HV-2026-001)
        address recipientAddress; // Địa chỉ ví Web3 của học viên
        string courseCode;      // Mã khóa học (VD: IELTS-7.5, TOEIC-850, VSTEP-B2)
        string courseName;      // Tên khóa học đầy đủ
        string score;           // Điểm số / Xếp loại (VD: "7.5 Overall", "850 L&R", "Xuất Sắc")
        uint256 issueDate;      // Ngày cấp (timestamp)
        uint256 expiryDate;     // Ngày hết hạn (timestamp, 0 nếu vô thời hạn)
        string issuerName;      // Tên trung tâm / đơn vị cấp
        address issuerAddress;  // Địa chỉ ví của trung tâm/giảng viên ký cấp
        string ipfsHash;        // CID lưu trữ metadata / phôi bằng trên IPFS
        bytes32 certHash;       // Hash toàn vẹn của dữ liệu bằng (SHA-256 / Keccak256)
        bool isRevoked;         // Trạng thái thu hồi
        string revokeReason;    // Lý do thu hồi nếu có
    }

    // Mapping tokenId => Certificate
    mapping(uint256 => Certificate) private _certificates;

    // Mapping mã chứng chỉ (certificateCode) => tokenId
    mapping(string => uint256) private _codeToTokenId;

    // Mapping mã hash (certHash) => tokenId
    mapping(bytes32 => uint256) private _hashToTokenId;

    // Mapping địa chỉ học viên => Danh sách các tokenId sở hữu
    mapping(address => uint256[]) private _studentCertificates;

    // Mapping địa chỉ trung tâm => Tên đơn vị cấp chứng chỉ
    mapping(address => string) public authorizedIssuerNames;

    // Danh sách tất cả token ID đã phát hành
    uint256[] private _allTokenIds;

    // Custom Errors
    error SoulboundTokenCannotBeTransferred();
    error CertificateNotFound();
    error CertificateCodeAlreadyExists();
    error CertificateHashAlreadyExists();
    error CertificateAlreadyRevoked();
    error InvalidRecipientAddress();
    error InvalidInputData();
    error BatchArrayLengthMismatch();

    // Events
    event CertificateIssued(
        uint256 indexed tokenId,
        string indexed certificateCode,
        address indexed recipient,
        string studentCode,
        string courseCode,
        bytes32 certHash,
        uint256 issueDate
    );

    event CertificateRevoked(
        uint256 indexed tokenId,
        string indexed certificateCode,
        string reason,
        address indexed revokedBy,
        uint256 revokeDate
    );

    event IssuerRegistered(address indexed issuerAddress, string issuerName);
    event IssuerRevoked(address indexed issuerAddress);

    /**
     * @notice Khởi tạo contract với tên đơn vị quản trị ban đầu
     * @param initialIssuerName Tên trung tâm tiếng Anh của Deployer
     */
    constructor(
        string memory initialIssuerName
    ) ERC721("English Center Certificate NFT", "ENCERT") Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        _grantRole(REVOKER_ROLE, msg.sender);

        authorizedIssuerNames[msg.sender] = initialIssuerName;
        emit IssuerRegistered(msg.sender, initialIssuerName);

        _nextTokenId = 1;
    }

    /**
     * @notice Đăng ký thêm cơ sở / trung tâm / giảng viên có quyền cấp chứng chỉ
     */
    function registerIssuer(address issuer, string calldata issuerName) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (issuer == address(0)) revert InvalidRecipientAddress();
        if (bytes(issuerName).length == 0) revert InvalidInputData();

        _grantRole(ISSUER_ROLE, issuer);
        authorizedIssuerNames[issuer] = issuerName;
        emit IssuerRegistered(issuer, issuerName);
    }

    /**
     * @notice Thu hồi quyền cấp của một trung tâm
     */
    function revokeIssuer(address issuer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ISSUER_ROLE, issuer);
        emit IssuerRevoked(issuer);
    }

    /**
     * @notice Cấp mới một chứng chỉ tiếng Anh chuẩn Soulbound NFT
     */
    function issueCertificate(
        address recipient,
        string calldata certificateCode,
        string calldata recipientName,
        string calldata studentCode,
        string calldata courseCode,
        string calldata courseName,
        string calldata score,
        uint256 expiryDate,
        string calldata ipfsHash,
        bytes32 certHash,
        string calldata tokenURI
    ) external onlyRole(ISSUER_ROLE) returns (uint256) {
        if (recipient == address(0)) revert InvalidRecipientAddress();
        if (bytes(certificateCode).length == 0 || bytes(recipientName).length == 0) revert InvalidInputData();
        if (_codeToTokenId[certificateCode] != 0) revert CertificateCodeAlreadyExists();
        if (_hashToTokenId[certHash] != 0) revert CertificateHashAlreadyExists();

        uint256 tokenId = _nextTokenId++;

        _certificates[tokenId] = Certificate({
            tokenId: tokenId,
            certificateCode: certificateCode,
            recipientName: recipientName,
            studentCode: studentCode,
            recipientAddress: recipient,
            courseCode: courseCode,
            courseName: courseName,
            score: score,
            issueDate: block.timestamp,
            expiryDate: expiryDate,
            issuerName: authorizedIssuerNames[msg.sender],
            issuerAddress: msg.sender,
            ipfsHash: ipfsHash,
            certHash: certHash,
            isRevoked: false,
            revokeReason: ""
        });

        _codeToTokenId[certificateCode] = tokenId;
        _hashToTokenId[certHash] = tokenId;
        _studentCertificates[recipient].push(tokenId);
        _allTokenIds.push(tokenId);

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit CertificateIssued(
            tokenId,
            certificateCode,
            recipient,
            studentCode,
            courseCode,
            certHash,
            block.timestamp
        );

        return tokenId;
    }

    /**
     * @notice Cấp chứng chỉ hàng loạt cho nhiều học viên trong một lớp
     */
    function batchIssueCertificates(
        address[] calldata recipients,
        string[] calldata certificateCodes,
        string[] calldata recipientNames,
        string[] calldata studentCodes,
        string calldata courseCode,
        string calldata courseName,
        string[] calldata scores,
        uint256 expiryDate,
        string[] calldata ipfsHashes,
        bytes32[] calldata certHashes,
        string[] calldata tokenURIs
    ) external onlyRole(ISSUER_ROLE) returns (uint256[] memory) {
        uint256 length = recipients.length;
        if (
            certificateCodes.length != length ||
            recipientNames.length != length ||
            studentCodes.length != length ||
            scores.length != length ||
            ipfsHashes.length != length ||
            certHashes.length != length ||
            tokenURIs.length != length
        ) {
            revert BatchArrayLengthMismatch();
        }

        uint256[] memory mintedTokenIds = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            if (recipients[i] == address(0)) revert InvalidRecipientAddress();
            if (_codeToTokenId[certificateCodes[i]] != 0) revert CertificateCodeAlreadyExists();
            if (_hashToTokenId[certHashes[i]] != 0) revert CertificateHashAlreadyExists();

            uint256 tokenId = _nextTokenId++;

            _certificates[tokenId] = Certificate({
                tokenId: tokenId,
                certificateCode: certificateCodes[i],
                recipientName: recipientNames[i],
                studentCode: studentCodes[i],
                recipientAddress: recipients[i],
                courseCode: courseCode,
                courseName: courseName,
                score: scores[i],
                issueDate: block.timestamp,
                expiryDate: expiryDate,
                issuerName: authorizedIssuerNames[msg.sender],
                issuerAddress: msg.sender,
                ipfsHash: ipfsHashes[i],
                certHash: certHashes[i],
                isRevoked: false,
                revokeReason: ""
            });

            _codeToTokenId[certificateCodes[i]] = tokenId;
            _hashToTokenId[certHashes[i]] = tokenId;
            _studentCertificates[recipients[i]].push(tokenId);
            _allTokenIds.push(tokenId);

            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);

            emit CertificateIssued(
                tokenId,
                certificateCodes[i],
                recipients[i],
                studentCodes[i],
                courseCode,
                certHashes[i],
                block.timestamp
            );

            mintedTokenIds[i] = tokenId;
        }

        return mintedTokenIds;
    }

    /**
     * @notice Thu hồi chứng chỉ (Do vi phạm gian lận hoặc sai sót)
     */
    function revokeCertificate(uint256 tokenId, string calldata reason) external onlyRole(REVOKER_ROLE) {
        if (_ownerOf(tokenId) == address(0)) revert CertificateNotFound();
        Certificate storage cert = _certificates[tokenId];
        if (cert.isRevoked) revert CertificateAlreadyRevoked();

        cert.isRevoked = true;
        cert.revokeReason = reason;

        emit CertificateRevoked(tokenId, cert.certificateCode, reason, msg.sender, block.timestamp);
    }

    /**
     * @notice Xác minh tính hợp lệ của chứng chỉ qua Token ID
     */
    function verifyCertificate(uint256 tokenId)
        external
        view
        returns (
            bool isValid,
            bool isRevoked,
            bool isExpired,
            Certificate memory cert
        )
    {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) {
            return (false, false, false, cert);
        }

        cert = _certificates[tokenId];
        isRevoked = cert.isRevoked;
        isExpired = (cert.expiryDate > 0 && block.timestamp > cert.expiryDate);
        isValid = (!isRevoked && !isExpired);

        return (isValid, isRevoked, isExpired, cert);
    }

    /**
     * @notice Xác minh chứng chỉ qua Mã chứng chỉ (VD: CERT-2026-IELTS-001)
     */
    function verifyByCertificateCode(string calldata certCode)
        external
        view
        returns (
            bool exists,
            uint256 tokenId,
            bool isValid,
            Certificate memory cert
        )
    {
        tokenId = _codeToTokenId[certCode];
        if (tokenId == 0 || _ownerOf(tokenId) == address(0)) {
            return (false, 0, false, cert);
        }

        cert = _certificates[tokenId];
        bool isExpired = (cert.expiryDate > 0 && block.timestamp > cert.expiryDate);
        isValid = (!cert.isRevoked && !isExpired);

        return (true, tokenId, isValid, cert);
    }

    /**
     * @notice Xác minh chứng chỉ qua mã băm SHA-256 (Nhúng trong mã QR / phôi bằng)
     */
    function verifyByHash(bytes32 certHash)
        external
        view
        returns (
            bool exists,
            uint256 tokenId,
            bool isValid,
            Certificate memory cert
        )
    {
        tokenId = _hashToTokenId[certHash];
        if (tokenId == 0 || _ownerOf(tokenId) == address(0)) {
            return (false, 0, false, cert);
        }

        cert = _certificates[tokenId];
        bool isExpired = (cert.expiryDate > 0 && block.timestamp > cert.expiryDate);
        isValid = (!cert.isRevoked && !isExpired);

        return (true, tokenId, isValid, cert);
    }

    /**
     * @notice Lấy thông tin chi tiết đầy đủ của một chứng chỉ
     */
    function getCertificateDetails(uint256 tokenId) external view returns (Certificate memory) {
        if (_ownerOf(tokenId) == address(0)) revert CertificateNotFound();
        return _certificates[tokenId];
    }

    /**
     * @notice Lấy toàn bộ danh sách Token ID mà học viên sở hữu
     */
    function getCertificatesByStudent(address student) external view returns (uint256[] memory) {
        return _studentCertificates[student];
    }

    /**
     * @notice Tổng số lượng chứng chỉ đã cấp phát thành công
     */
    function totalIssued() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @notice Lấy danh sách toàn bộ Token ID đã phát hành
     */
    function getAllTokenIds() external view returns (uint256[] memory) {
        return _allTokenIds;
    }

    /**
     * @dev Cơ chế Soulbound Token (SBT): Chặn hoàn toàn hành động chuyển nhượng giữa các tài khoản
     * Cho phép Mint (from == address(0)) và Burn (to == address(0)).
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundTokenCannotBeTransferred();
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Hỗ trợ giao diện ERC721URIStorage và AccessControl
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
