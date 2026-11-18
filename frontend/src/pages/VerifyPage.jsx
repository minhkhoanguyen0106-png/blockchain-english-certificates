import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, ShieldCheck, AlertTriangle, XCircle, Download, ExternalLink, QrCode, ArrowLeft, RefreshCw, Wallet, Award, Copy, Check } from "lucide-react";
import { getCertificateByCode, getCertificatesByStudentWallet, connectMetaMask, isMetaMaskInstalled, shortenAddress } from "../services/web3Service";
import CertificateCard from "../components/CertificateCard";

export default function VerifyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [activeTab, setActiveTab] = useState("code"); // "code" | "wallet"
  const [inputCode, setInputCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Student Web3 Wallet Lookup state (Phương án 1 - Học viên không cần đăng nhập mật khẩu)
  const [walletInput, setWalletInput] = useState("");
  const [walletCerts, setWalletCerts] = useState([]);
  const [walletSearched, setWalletSearched] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");

  const handleSearch = async (codeToSearch) => {
    const code = (codeToSearch || inputCode).trim();
    if (!code) return;

    setActiveTab("code");
    setLoading(true);
    setHasSearched(true);
    setSearchParams({ code });

    try {
      const cert = await getCertificateByCode(code);
      setResult(cert);
    } catch (err) {
      console.error(err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLookup = async (addressToSearch) => {
    const addr = (addressToSearch || walletInput).trim();
    if (!addr) return;
    setWalletLoading(true);
    setWalletSearched(true);
    setWalletError("");
    try {
      const list = await getCertificatesByStudentWallet(addr);
      setWalletCerts(list);
    } catch (err) {
      setWalletCerts([]);
      setWalletError(err.message || "Không thể tra cứu ví học viên.");
    } finally {
      setWalletLoading(false);
    }
  };

  const handleConnectStudentWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setWalletError("Trình duyệt chưa cài đặt MetaMask. Bạn có thể dán trực tiếp địa chỉ ví 0x... vào ô bên cạnh để xem danh sách bằng.");
      return;
    }
    try {
      setWalletLoading(true);
      setWalletError("");
      const acc = await connectMetaMask();
      if (acc?.address) {
        setWalletInput(acc.address);
        await handleWalletLookup(acc.address);
      }
    } catch (err) {
      setWalletError(err.message || "Không thể kết nối ví MetaMask.");
      setWalletLoading(false);
    }
  };

  const handleCopyShareLink = () => {
    if (!result?.certificate_code) return;
    const url = `${window.location.origin}/verify?code=${encodeURIComponent(result.certificate_code)}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)" }}>
            Tra Cứu &amp; Xác Thực <span className="text-gradient">Chứng Chỉ Số</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Kiểm tra tính toàn vẹn trực tiếp từ dữ liệu xác thực điện tử — Học viên &amp; Nhà tuyển dụng không cần đăng nhập.
          </p>
        </div>

        {/* Mode Switch Tabs: Tra cứu mã vs Ví chứng chỉ học viên */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`btn ${activeTab === "code" ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "10px 20px", fontSize: "13px" }}
          >
            <Search size={15} />
            Tra Cứu Theo Mã / QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wallet")}
            className={`btn ${activeTab === "wallet" ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "10px 20px", fontSize: "13px" }}
          >
            <Wallet size={15} />
            Ví Chứng Chỉ Của Học Viên
          </button>
        </div>

        {/* TAB 2: STUDENT WALLET LOOKUP (Web3-native, no password needed) */}
        {activeTab === "wallet" && (
          <div>
            <div className="glass-panel" style={{ padding: "22px 24px", marginBottom: "28px" }}>
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Xem toàn bộ chứng chỉ thuộc quyền sở hữu ví của bạn
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "3px" }}>
                  Kết nối ví MetaMask cá nhân hoặc dán địa chỉ ví Ethereum (`0x...`) đã đăng ký với Trung tâm để xem tất cả chứng chỉ số định danh.
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleWalletLookup();
                }}
                style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}
              >
                <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
                  <input
                    type="text"
                    placeholder="Nhập địa chỉ ví học viên (VD: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8)..."
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: "40px", height: "46px", fontSize: "14px" }}
                  />
                  <Wallet size={16} color="var(--text-muted)" style={{ position: "absolute", left: "13px", top: "15px" }} />
                </div>

                <button type="submit" disabled={walletLoading} className="btn btn-primary" style={{ height: "46px", padding: "0 20px" }}>
                  {walletLoading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                  Tra Cứu Ví
                </button>

                <button
                  type="button"
                  onClick={handleConnectStudentWallet}
                  disabled={walletLoading}
                  className="btn btn-gold"
                  style={{ height: "46px", padding: "0 18px" }}
                >
                  <Wallet size={16} />
                  Kết Nối MetaMask
                </button>
              </form>

              {walletError && (
                <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "var(--danger-bg)", color: "var(--danger-text)", fontSize: "13px" }}>
                  {walletError}
                </div>
              )}
            </div>

            {walletLoading && (
              <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
                <div style={{ width: "42px", height: "42px", border: "4px solid var(--border-subtle)", borderTopColor: "var(--primary)", borderRadius: "50%", margin: "0 auto 14px", animation: "spinSlow 1s linear infinite" }} />
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Đang tải danh sách chứng chỉ trong ví...</div>
              </div>
            )}

            {!walletLoading && walletSearched && walletCerts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>
                  Tìm thấy <span style={{ color: "var(--primary)" }}>{walletCerts.length}</span> chứng chỉ gắn với ví {shortenAddress(walletInput)}:
                </div>
                {walletCerts.map((c) => (
                  <div
                    key={c.certificate_code}
                    className="glass-panel"
                    style={{
                      padding: "18px 22px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      flexWrap: "wrap"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <Award size={18} color="var(--primary)" />
                        <strong style={{ fontSize: "16px", color: "var(--primary)" }}>{c.certificate_code}</strong>
                        {c.status === "ISSUED_ON_CHAIN" && <span className="badge badge-success">Hợp Lệ</span>}
                        {c.status === "REVOKED" && <span className="badge badge-danger">Đã Thu Hồi</span>}
                        {c.onchain_verified && (
                          <span className="badge" style={{ background: "var(--primary-bg)", color: "var(--primary)", fontSize: "11px" }}>
                            Đã đối soát sổ cái
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginTop: "6px" }}>
                        {c.student_name} — {c.course_name} (<span style={{ color: "var(--accent-gold)" }}>{c.score}</span>)
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                        Ngày cấp: {c.issue_date || "—"} {c.token_id ? `• Mã số bằng #${c.token_id}` : ""}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setInputCode(c.certificate_code);
                          handleSearch(c.certificate_code);
                        }}
                        className="btn btn-primary"
                        style={{ padding: "8px 14px", fontSize: "12px" }}
                      >
                        <ShieldCheck size={14} /> Xem &amp; Xác Thực
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(`http://localhost:5000/api/public/pdf/${c.certificate_code}`, "_blank")}
                        className="btn btn-outline"
                        style={{ padding: "8px 12px", fontSize: "12px" }}
                        title="Tải PDF"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!walletLoading && walletSearched && !walletError && walletCerts.length === 0 && (
              <div className="glass-panel" style={{ padding: "36px", textAlign: "center" }}>
                <Wallet size={32} color="var(--text-muted)" style={{ marginBottom: "10px" }} />
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Chưa có chứng chỉ nào được phát hành cho địa chỉ ví này
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
                  Hãy kiểm tra lại địa chỉ ví đã đăng ký với Trung tâm hoặc dùng tab Tra Cứu Theo Mã.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: SEARCH BY CERTIFICATE CODE / QR */}
        {activeTab === "code" && (
        <>
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
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>Đang đối soát chứng chỉ điện tử...</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>Xác thực chữ ký số và dữ liệu chứng chỉ trên hệ thống</p>
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
                  <h4 style={{ color: "var(--success-text)", fontWeight: 800, fontSize: "16px" }}>
                    CHỨNG CHỈ HỢP LỆ &amp; XÁC THỰC THÀNH CÔNG
                  </h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "2px" }}>
                    {result.onchain_verified
                      ? "Đã đối soát khớp 100% dữ liệu trực tiếp với Hợp đồng Thông minh (chống chỉnh sửa tuyệt đối)."
                      : "Chứng chỉ đã được xác nhận chữ ký số của Quản trị viên và lưu trữ an toàn trên hệ thống."}
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
                  <h4 style={{ color: "var(--danger-text)", fontWeight: 800, fontSize: "16px" }}>CHỨNG CHỈ ĐÃ BỊ THU HỒI</h4>
                  <p style={{ color: "var(--danger-text)", fontSize: "13px", marginTop: "2px", fontWeight: 600 }}>
                    Lý do thu hồi: {result.revoked_reason || "Vi phạm quy chế thi cử"}
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>
                    Thời điểm thu hồi: {result.revoked_at}
                  </p>
                </div>
              </div>
            )}

            {result.status === "TAMPERED" && (
              <div style={{
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.5)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px"
              }}>
                <div style={{ background: "#f59e0b", borderRadius: "50%", padding: "6px", display: "flex", marginTop: "2px", color: "#ffffff" }}>
                  <AlertTriangle size={24} color="#ffffff" />
                </div>
                <div>
                  <h4 style={{ color: "#d97706", fontWeight: 800, fontSize: "16px" }}>CẢNH BÁO: SAI LỆCH DỮ LIỆU TÀI LIỆU (TAMPERED)</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "2px" }}>
                    Nội dung lưu trữ không trùng khớp với bản ghi gốc bất biến đã cam kết trên Hợp đồng Thông minh. Dấu hiệu dữ liệu đã bị chỉnh sửa trái phép!
                  </p>
                  {result.tamper_details && (
                    <p style={{ color: "#d97706", fontSize: "12px", fontWeight: 600, marginTop: "6px" }}>
                      Chi tiết sai lệch: {result.tamper_details}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Certificate Visual Card */}
            <CertificateCard cert={result} />

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "32px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  if (result.pdf_url && result.pdf_url !== "#") {
                    window.open(result.pdf_url, "_blank");
                  } else {
                    window.open(`http://localhost:5000/api/public/pdf/${result.certificate_code}`, "_blank");
                  }
                }}
                className="btn btn-primary"
              >
                <Download size={16} />
                Tải Phôi Bằng PDF In Ấn
              </button>

              <button
                type="button"
                onClick={handleCopyShareLink}
                className="btn btn-outline"
              >
                {copiedLink ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} />}
                {copiedLink ? "Đã Copy Link Xác Thực" : "Chia Sẻ Link Xác Thực"}
              </button>
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
              Mã chứng chỉ <strong>"{inputCode}"</strong> chưa từng được cấp phát hoặc không tồn tại trên hệ thống xác thực. Cẩn trọng với các bằng cấp giả mạo!
            </p>
          </div>
        )}
        </>
        )}

      </div>
    </div>
  );
}
