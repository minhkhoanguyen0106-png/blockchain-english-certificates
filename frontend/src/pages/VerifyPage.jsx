import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, ShieldCheck, AlertTriangle, XCircle, Download, QrCode, ArrowLeft, RefreshCw, Copy, Check, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { getCertificateByCode } from "../services/web3Service";
import CertificateCard from "../components/CertificateCard";

export default function VerifyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const initialTab = searchParams.get("tab") || "code";

  const [activeTab, setActiveTab] = useState(initialTab === "qr" ? "qr" : "code");
  const [inputCode, setInputCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Embedded QR Scanner state (Tab "qr")
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [qrError, setQrError] = useState("");
  const scannerRef = useRef(null);

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

  const handleQrDecoded = (text) => {
    let certCode = (text || "").trim();
    try {
      if (certCode.startsWith("http://") || certCode.startsWith("https://")) {
        const url = new URL(certCode);
        if (url.searchParams.get("code")) {
          certCode = url.searchParams.get("code");
        } else {
          const segments = url.pathname.split("/").filter(Boolean);
          const last = segments[segments.length - 1];
          if (last && last !== "verify") certCode = last;
        }
      }
    } catch {
      certCode = text;
    }

    setScanResult(certCode);
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
    setTimeout(() => {
      setScanResult("");
      setInputCode(certCode);
      handleSearch(certCode);
    }, 650);
  };

  const handleQrFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrError("");
    const html5QrCode = new Html5Qrcode("verify-file-reader-hidden");
    html5QrCode
      .scanFile(file, true)
      .then((decodedText) => handleQrDecoded(decodedText))
      .catch(() => {
        setQrError("Không tìm thấy mã QR hợp lệ trong bức ảnh này. Vui lòng chọn ảnh rõ nét hơn.");
      });
  };

  // Tự động bật/tắt camera khi chuyển vào/ra khỏi tab "Quét Mã QR"
  useEffect(() => {
    if (activeTab !== "qr") return;
    let isMounted = true;
    const html5QrCode = new Html5Qrcode("verify-qr-reader");
    scannerRef.current = html5QrCode;
    setQrError("");
    setScanResult("");

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => handleQrDecoded(decodedText),
        () => {}
      )
      .then(() => {
        if (isMounted) setCameraActive(true);
      })
      .catch(() => {
        if (isMounted) {
          setCameraActive(false);
          setQrError("Không thể mở Camera thiết bị (chưa cấp quyền hoặc không có webcam). Bạn có thể chọn Tải Ảnh Chụp Mã QR Từ Máy bên dưới.");
        }
      });

    return () => {
      isMounted = false;
      setCameraActive(false);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [activeTab]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "qr" || t === "code") {
      setActiveTab(t);
    }
  }, [searchParams]);

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

        {/* Mode Switch Tabs: Nhập Mã Bằng & Quét Mã QR */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "22px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => { setActiveTab("code"); setSearchParams(inputCode ? { code: inputCode } : {}); }}
            className={`btn ${activeTab === "code" ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "10px 22px", fontSize: "13px" }}
          >
            <Search size={15} />
            Nhập Mã Bằng
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("qr"); setSearchParams({ tab: "qr" }); }}
            className={`btn ${activeTab === "qr" ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "10px 22px", fontSize: "13px" }}
          >
            <QrCode size={15} />
            Quét Mã QR
          </button>
        </div>

        {/* TAB 2: EMBEDDED QR SCANNER */}
        {activeTab === "qr" && (
          <div className="glass-panel" style={{ padding: "26px", maxWidth: "560px", margin: "0 auto" }}>
            <div style={{
              position: "relative",
              width: "100%",
              maxWidth: "340px",
              height: "340px",
              margin: "0 auto",
              background: "#050811",
              borderRadius: "16px",
              overflow: "hidden",
              border: "2px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div id="verify-qr-reader" style={{ width: "100%", height: "100%" }} />
              <div id="verify-file-reader-hidden" style={{ display: "none" }} />
              {cameraActive && !scanResult && <div className="laser-beam" />}
              {scanResult && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(16, 185, 129, 0.95)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  zIndex: 20
                }}>
                  <CheckCircle2 size={52} />
                  <div style={{ fontWeight: 800, fontSize: "16px", marginTop: "10px" }}>ĐÃ NHẬN DIỆN MÃ QR!</div>
                  <div style={{ fontSize: "13px", marginTop: "4px" }}>Đang thẩm định: {scanResult}</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <label className="btn btn-outline" style={{ cursor: "pointer", display: "inline-flex" }}>
                <Upload size={16} />
                Tải Ảnh Chụp Mã QR Từ Máy
                <input type="file" accept="image/*" onChange={handleQrFileUpload} style={{ display: "none" }} />
              </label>
            </div>

            {qrError && (
              <div style={{
                marginTop: "16px",
                background: "var(--warning-bg)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                color: "var(--warning-text)",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px"
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{qrError}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: SEARCH BY CERTIFICATE CODE */}
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
                placeholder="Nhập mã chứng chỉ cần tra cứu..."
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
          </form>
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

            {result.status === "UNVERIFIED" && (
              <div role="status" style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.5)", borderRadius: "var(--radius-md)", padding: "16px 20px", marginBottom: "24px" }}>
                <h4 style={{ color: "#d97706", fontWeight: 800, fontSize: "16px" }}>CHƯA THỂ XÁC MINH CHỨNG CHỈ</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                  Không đối soát được blockchain hoặc PDF gốc. Hãy thử lại sau; trạng thái này chưa xác nhận chứng chỉ hợp lệ.
                </p>
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
