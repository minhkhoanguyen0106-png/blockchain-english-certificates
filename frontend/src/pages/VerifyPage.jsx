import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, ShieldCheck, AlertTriangle, XCircle, Download, ExternalLink, QrCode, ArrowLeft, RefreshCw } from "lucide-react";
import { getCertificateByCode } from "../services/web3Service";
import CertificateCard from "../components/CertificateCard";

export default function VerifyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [inputCode, setInputCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (codeToSearch) => {
    const code = (codeToSearch || inputCode).trim();
    if (!code) return;

    setLoading(true);
    setHasSearched(true);
    setSearchParams({ code });

    try {
      await new Promise(r => setTimeout(r, 600));
      const cert = await getCertificateByCode(code);
      setResult(cert);
    } catch (err) {
      console.error(err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setInputCode(initialCode);
      handleSearch(initialCode);
    }
  }, [initialCode]);

  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div className="container" style={{ maxWidth: "860px" }}>
        
        {/* Back navigation */}
        <div style={{ marginBottom: "20px" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "14px", fontWeight: 500 }}>
            <ArrowLeft size={16} /> Quay lại trang chủ
          </Link>
        </div>

        {/* Page Title */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)" }}>
            Tra Cứu & Xác Thực <span className="text-gradient">On-Chain</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Kiểm tra tính toàn vẹn và thẩm quyền cấp bằng trực tiếp từ Smart Contract trên sổ cái Blockchain.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="glass-panel" style={{ padding: "20px 24px", marginBottom: "32px" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            style={{ display: "flex", gap: "12px", alignItems: "center" }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="Nhập mã chứng chỉ (Ví dụ: CERT-IELTS-2026-001 hoặc CERT-TOEIC-2026-088)..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "42px", height: "48px", fontSize: "15px" }}
              />
              <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "15px" }} />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: "48px", padding: "0 24px" }}>
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Đang đối soát...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Thẩm Định
                </>
              )}
            </button>

            <Link to="/scanner" className="btn btn-outline" style={{ height: "48px", padding: "0 18px" }} title="Quét camera">
              <QrCode size={18} />
            </Link>
          </form>

          {/* Quick sample chips */}
          <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "12px" }}>
            <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Thử nhanh mã mẫu:</span>
            <button
              type="button"
              onClick={() => { setInputCode("CERT-IELTS-2026-001"); handleSearch("CERT-IELTS-2026-001"); }}
              style={{
                background: "var(--primary-bg)",
                border: "1px solid var(--border-subtle)",
                color: "var(--primary)",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600
              }}
            >
              CERT-IELTS-2026-001 (IELTS 8.0 Hợp lệ)
            </button>
            <button
              type="button"
              onClick={() => { setInputCode("CERT-TOEIC-2026-088"); handleSearch("CERT-TOEIC-2026-088"); }}
              style={{
                background: "var(--accent-gold-bg)",
                border: "1px solid var(--border-subtle)",
                color: "var(--accent-gold)",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600
              }}
            >
              CERT-TOEIC-2026-088 (TOEIC 920)
            </button>
            <button
              type="button"
              onClick={() => { setInputCode("CERT-VSTEP-2026-012"); handleSearch("CERT-VSTEP-2026-012"); }}
              style={{
                background: "var(--danger-bg)",
                border: "1px solid var(--border-subtle)",
                color: "var(--danger-text)",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600
              }}
            >
              CERT-VSTEP-2026-012 (Bị thu hồi)
            </button>
          </div>
        </div>

        {/* Verification Result Showcase */}
        {loading && (
          <div className="glass-panel" style={{ padding: "44px 20px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", border: "4px solid var(--border-subtle)", borderTopColor: "var(--primary)", borderRadius: "50%", margin: "0 auto 16px", animation: "spinSlow 1s linear infinite" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>Đang đối soát sổ cái Blockchain...</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>Xác thực chữ ký Smart Contract Soulbound Token và CID phân tán trên IPFS</p>
          </div>
        )}

        {!loading && hasSearched && result && (
          <div>
            {/* Status Alert Banner */}
            {result.status === "ISSUED_ON_CHAIN" && (
              <div style={{
                background: "var(--success-bg)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "14px"
              }}>
                <div style={{ background: "var(--success-color)", borderRadius: "50%", padding: "6px", display: "flex", color: "#04121e" }}>
                  <ShieldCheck size={24} color="#04121e" />
                </div>
                <div>
                  <h4 style={{ color: "var(--success-text)", fontWeight: 800, fontSize: "16px" }}>CHỨNG CHỈ HỢP LỆ (ON-CHAIN VERIFIED)</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "2px" }}>
                    Chứng chỉ đã được xác nhận chữ ký số của Giám đốc trung tâm và đúc thành công trên Blockchain.
                  </p>
                </div>
              </div>
            )}

            {result.status === "REVOKED" && (
              <div style={{
                background: "var(--danger-bg)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px"
              }}>
                <div style={{ background: "var(--danger-color)", borderRadius: "50%", padding: "6px", display: "flex", marginTop: "2px", color: "#ffffff" }}>
                  <XCircle size={24} color="#ffffff" />
                </div>
                <div>
                  <h4 style={{ color: "var(--danger-text)", fontWeight: 800, fontSize: "16px" }}>CHỨNG CHỈ ĐÃ BỊ THU HỒI (REVOKED)</h4>
                  <p style={{ color: "var(--danger-text)", fontSize: "13px", marginTop: "2px", fontWeight: 600 }}>
                    Lý do thu hồi: {result.revoked_reason || "Vi phạm quy chế thi cử"}
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>
                    Thời điểm ghi nhận thu hồi on-chain: {result.revoked_at}
                  </p>
                </div>
              </div>
            )}

            {/* Certificate Visual Card */}
            <CertificateCard cert={result} />

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "32px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => alert(`Đang tải file PDF chứng chỉ: ${result.certificate_code}.pdf`)}
                className="btn btn-primary"
              >
                <Download size={16} />
                Tải Phôi Bằng PDF In Ấn
              </button>

              <a
                href={`https://gateway.pinata.cloud/ipfs/${result.ipfs_hash}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
              >
                <ExternalLink size={16} />
                Xem Phôi Gốc Trên IPFS
              </a>

              <a
                href={`https://sepolia.etherscan.io/tx/${result.tx_hash}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
              >
                <ExternalLink size={16} />
                Kiểm Tra Etherscan
              </a>
            </div>
          </div>
        )}

        {!loading && hasSearched && !result && (
          <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "var(--warning-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <AlertTriangle size={28} color="var(--warning-text)" />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--warning-text)" }}>Không Tìm Thấy Chứng Chỉ Này</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "500px", margin: "8px auto 20px" }}>
              Mã chứng chỉ <strong>"{inputCode}"</strong> chưa từng được cấp phát hoặc không tồn tại trên hợp đồng thông minh. Cẩn trọng với các bằng cấp giả mạo!
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
