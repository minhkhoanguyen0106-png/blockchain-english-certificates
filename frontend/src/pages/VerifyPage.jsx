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
      // Giả lập độ trễ truy vấn Blockchain 600ms
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
      <div className="container" style={{ maxWidth: "850px" }}>
        
        {/* Back navigation */}
        <div style={{ marginBottom: "20px" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "14px" }}>
            <ArrowLeft size={16} /> Quay lại trang chủ
          </Link>
        </div>

        {/* Page Title */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>
            Tra Cứu & Xác Thực <span className="text-gradient">On-Chain</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Kiểm tra tính toàn vẹn của chứng chỉ tiếng Anh trực tiếp từ hợp đồng thông minh trên Blockchain.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="glass-panel" style={{ padding: "16px 20px", marginBottom: "32px" }}>
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
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "12px" }}>
            <span style={{ color: "var(--text-muted)" }}>Thử nhanh:</span>
            <button
              type="button"
              onClick={() => { setInputCode("CERT-IELTS-2026-001"); handleSearch("CERT-IELTS-2026-001"); }}
              style={{ background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "var(--primary)", padding: "2px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
            >
              CERT-IELTS-2026-001 (IELTS 8.0)
            </button>
            <button
              type="button"
              onClick={() => { setInputCode("CERT-TOEIC-2026-088"); handleSearch("CERT-TOEIC-2026-088"); }}
              style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "var(--accent-gold)", padding: "2px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
            >
              CERT-TOEIC-2026-088 (TOEIC 920)
            </button>
            <button
              type="button"
              onClick={() => { setInputCode("CERT-VSTEP-2026-012"); handleSearch("CERT-VSTEP-2026-012"); }}
              style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", padding: "2px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
            >
              CERT-VSTEP-2026-012 (Bị thu hồi)
            </button>
          </div>
        </div>

        {/* Verification Result Showcase */}
        {loading && (
          <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", border: "4px solid rgba(56, 189, 248, 0.2)", borderTopColor: "var(--primary)", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Đang kiểm tra sổ cái Blockchain...</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Đối soát Smart Contract Soulbound Token và CID trên mạng IPFS</p>
          </div>
        )}

        {!loading && hasSearched && result && (
          <div>
            {/* Status Alert Banner */}
            {result.status === "ISSUED_ON_CHAIN" && (
              <div style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <div style={{ background: "#10b981", borderRadius: "50%", padding: "6px", display: "flex" }}>
                  <ShieldCheck size={24} color="#04121e" />
                </div>
                <div>
                  <h4 style={{ color: "#34d399", fontWeight: 700, fontSize: "16px" }}>CHỨNG CHỈ HỢP LỆ (ON-CHAIN VERIFIED)</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                    Chứng chỉ đã được xác nhận chữ ký số của Giám đốc trung tâm và đúc thành công trên Blockchain.
                  </p>
                </div>
              </div>
            )}

            {result.status === "REVOKED" && (
              <div style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px"
              }}>
                <div style={{ background: "#ef4444", borderRadius: "50%", padding: "6px", display: "flex", marginTop: "2px" }}>
                  <XCircle size={24} color="#ffffff" />
                </div>
                <div>
                  <h4 style={{ color: "#f87171", fontWeight: 700, fontSize: "16px" }}>CHỨNG CHỈ ĐÃ BỊ THU HỒI (REVOKED)</h4>
                  <p style={{ color: "#fca5a5", fontSize: "13px", marginTop: "2px" }}>
                    Lý do thu hồi: <strong>{result.revoked_reason || "Vi phạm quy chế khảo thí"}</strong>
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>
                    Ngày ghi nhận thu hồi on-chain: {result.revoked_at}
                  </p>
                </div>
              </div>
            )}

            {/* Certificate Visual Card */}
            <CertificateCard cert={result} />

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "30px", flexWrap: "wrap" }}>
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
            <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <AlertTriangle size={28} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#fef3c7" }}>Không Tìm Thấy Chứng Chỉ Này</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "500px", margin: "8px auto 20px" }}>
              Mã chứng chỉ <strong>"{inputCode}"</strong> chưa từng được phát hành hoặc không tồn tại trên hợp đồng thông minh. Cẩn trọng với các bằng cấp giả mạo!
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
