import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ShieldCheck, AlertTriangle, XCircle, Download, QrCode, RefreshCw, Copy, Check, Upload, CheckCircle2, AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { getCertificateByCode } from "../services/web3Service";
import CertificateCard from "./CertificateCard";

const CertificateVerifier = forwardRef(function CertificateVerifier({ syncUrl = false }, ref) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const initialTab = searchParams.get("tab") || "code";

  const [activeTab, setActiveTab] = useState(initialTab === "qr" ? "qr" : "code");
  const [inputCode, setInputCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Embedded QR Scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [qrError, setQrError] = useState("");
  const scannerRef = useRef(null);
  const resultRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      setActiveTab("code");
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => inputRef.current?.focus(), 380);
    },
    openQrScanner: () => {
      setActiveTab("qr");
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }));

  // Unique DOM ids in case mounted on different routes
  const qrElementId = syncUrl ? "verify-qr-reader" : "home-qr-reader";
  const fileElementId = syncUrl ? "verify-file-reader-hidden" : "home-file-reader-hidden";

  const handleSearch = async (codeToSearch) => {
    const code = (codeToSearch || inputCode).trim();
    if (!code) return;

    setActiveTab("code");
    setLoading(true);
    setHasSearched(true);
    if (syncUrl) {
      setSearchParams({ code });
    }

    try {
      const cert = await getCertificateByCode(code);
      setResult(cert);
    } catch (err) {
      console.error(err);
      setResult(null);
    } finally {
      setLoading(false);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
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
    const html5QrCode = new Html5Qrcode(fileElementId);
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
    const html5QrCode = new Html5Qrcode(qrElementId);
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
  }, [activeTab, qrElementId]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "qr" || t === "code") {
      setActiveTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    if (initialCode) {
      setInputCode(initialCode);
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const handleCopyShareLink = () => {
    if (!result?.certificate_code) return;
    const url = `${window.location.origin}/verify?code=${encodeURIComponent(result.certificate_code)}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReset = () => {
    setInputCode("");
    setResult(null);
    setHasSearched(false);
    if (syncUrl) setSearchParams({});
  };

  return (
    <div ref={containerRef} style={{ maxWidth: "680px", margin: "0 auto", textAlign: "left" }}>
      {/* Ultra-clean Pill Search Bar with Icon-only QR & Search actions */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="search-spotlight-bar"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Nhập mã chứng chỉ cần tra cứu..."
          value={inputCode}
          onChange={(e) => {
            setInputCode(e.target.value);
            if (activeTab === "qr") setActiveTab("code");
          }}
          className="search-spotlight-input"
        />

        <button
          type="button"
          onClick={() => {
            const nextTab = activeTab === "qr" ? "code" : "qr";
            setActiveTab(nextTab);
            if (syncUrl) setSearchParams(nextTab === "qr" ? { tab: "qr" } : (inputCode ? { code: inputCode } : {}));
          }}
          className={`spotlight-icon-btn ${activeTab === "qr" ? "qr-active-pulse" : ""}`}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: activeTab === "qr" ? "var(--primary-bg)" : "transparent",
            color: activeTab === "qr" ? "var(--primary)" : "var(--text-secondary)",
            flexShrink: 0
          }}
          title="Quét mã QR bằng camera hoặc tải ảnh"
          aria-label="Quét mã QR"
        >
          <QrCode size={19} />
        </button>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary spotlight-icon-btn"
          style={{
            width: "42px",
            height: "42px",
            padding: 0,
            borderRadius: "50%",
            flexShrink: 0
          }}
          title="Tra cứu & xác thực chứng chỉ"
          aria-label="Tra cứu chứng chỉ"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
        </button>
      </form>

      {/* Slide-down Embedded QR Scanner Panel (Only visible when Quét QR is toggled on) */}
      {activeTab === "qr" && (
        <div className="glass-panel qr-panel-reveal" style={{ padding: "24px", marginTop: "16px", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <QrCode size={16} color="var(--primary)" /> Quét Mã QR Trên Bằng Cấp
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab("code");
                if (syncUrl) setSearchParams(inputCode ? { code: inputCode } : {});
              }}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              Đóng ✕
            </button>
          </div>

          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "300px",
            height: "300px",
            margin: "0 auto",
            background: "#050811",
            borderRadius: "14px",
            overflow: "hidden",
            border: "2px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div id={qrElementId} style={{ width: "100%", height: "100%" }} />
            <div id={fileElementId} style={{ display: "none" }} />
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
                <CheckCircle2 size={48} />
                <div style={{ fontWeight: 800, fontSize: "15px", marginTop: "10px" }}>Đã quét được mã QR!</div>
                <div style={{ fontSize: "13px", marginTop: "4px" }}>Đang tra cứu mã: {scanResult}</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <label className="btn btn-outline" style={{ cursor: "pointer", display: "inline-flex", fontSize: "13px" }}>
              <Upload size={15} />
              Chọn Ảnh Mã QR Từ Máy
              <input type="file" accept="image/*" onChange={handleQrFileUpload} style={{ display: "none" }} />
            </label>
          </div>

          {qrError && (
            <div style={{
              marginTop: "14px",
              background: "var(--warning-bg)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              color: "var(--warning-text)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              fontSize: "12.5px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px"
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{qrError}</span>
            </div>
          )}
        </div>
      )}

      {/* Verification Result Area */}
      <div ref={resultRef}>
        {activeTab === "code" && loading && (
          <div className="glass-panel result-phase-1" style={{ padding: "36px 24px", textAlign: "center", marginTop: "24px" }}>
            <svg width="110" height="84" viewBox="0 0 110 84" fill="none" style={{ display: "block", margin: "0 auto 14px" }} aria-hidden="true">
              <rect x="10" y="8" width="90" height="68" rx="12" fill="var(--bg-surface-elevated)" stroke="var(--primary)" strokeWidth="2" strokeOpacity="0.4" />
              <rect x="20" y="20" width="24" height="24" rx="5" fill="var(--primary-bg)" stroke="var(--primary)" strokeWidth="1.5" />
              <rect x="25" y="25" width="6" height="6" rx="1.5" fill="var(--primary)" />
              <rect x="34" y="25" width="5" height="5" rx="1" fill="var(--primary)" opacity="0.65" />
              <rect x="25" y="34" width="5" height="5" rx="1" fill="var(--primary)" opacity="0.65" />
              <rect x="33" y="33" width="6" height="6" rx="1.5" fill="var(--primary)" />
              <rect x="52" y="22" width="38" height="6" rx="3" fill="var(--primary)" opacity="0.7" className="live-bar-pulse-1" />
              <rect x="52" y="34" width="28" height="5" rx="2.5" fill="var(--primary)" opacity="0.45" className="live-bar-pulse-2" />
              <rect x="20" y="54" width="66" height="5" rx="2.5" fill="var(--primary)" opacity="0.3" className="live-bar-pulse-3" />
              <line x1="16" y1="16" x2="94" y2="16" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" className="live-scan-beam" />
            </svg>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>Đang tìm kiếm chứng chỉ...</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>Vui lòng chờ trong giây lát để kiểm tra thông tin văn bằng</p>
          </div>
        )}

        {activeTab === "code" && !loading && hasSearched && result && (
          <div key={result.certificate_code || "verified"} style={{ marginTop: "28px" }}>
            {result.status === "ISSUED_ON_CHAIN" && (
              <div className="result-phase-1" style={{
                background: "var(--success-bg)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                marginBottom: "22px",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px"
              }}>
                <div style={{ background: "var(--success-color)", borderRadius: "50%", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 13L10 18L19 7" stroke="#04121e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="draw-check-path" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: "var(--success-text)", fontWeight: 800, fontSize: "16px" }}>
                    Chứng Chỉ Hợp Lệ
                  </h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "2px" }}>
                    {result.onchain_verified
                      ? "Thông tin chứng chỉ trùng khớp hoàn toàn giữa hồ sơ Trung tâm, dữ liệu gốc và tài liệu PDF."
                      : "Chứng chỉ đã được Trung tâm Khảo thí cấp phát và hiện đang có hiệu lực."}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 600, padding: "3px 10px", borderRadius: "9999px", background: "rgba(16, 185, 129, 0.14)", color: "var(--success-text)" }}>
                      ✓ Hồ sơ Trung tâm
                    </span>
                    {result.onchain_verified && (
                      <span style={{ fontSize: "11.5px", fontWeight: 600, padding: "3px 10px", borderRadius: "9999px", background: "rgba(16, 185, 129, 0.14)", color: "var(--success-text)" }}>
                        ✓ Đối chiếu dữ liệu gốc
                      </span>
                    )}
                    {result.document_hash_verified && (
                      <span style={{ fontSize: "11.5px", fontWeight: 600, padding: "3px 10px", borderRadius: "9999px", background: "rgba(16, 185, 129, 0.14)", color: "var(--success-text)" }}>
                        ✓ Bản PDF nguyên vẹn (SHA-256)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {result.status === "EXPIRED" && (
              <div className="result-phase-1" style={{
                background: "rgba(148, 163, 184, 0.16)",
                border: "1px solid rgba(148, 163, 184, 0.45)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                marginBottom: "22px",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px"
              }}>
                <div style={{ background: "#64748b", borderRadius: "50%", padding: "6px", display: "flex", marginTop: "2px", color: "#ffffff" }}>
                  <Clock size={22} color="#ffffff" />
                </div>
                <div>
                  <h4 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "16px" }}>
                    Chứng Chỉ Đã Hết Hạn Hiệu Lực
                  </h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "2px" }}>
                    Chứng chỉ này là bản gốc hợp pháp do Trung tâm cấp, tuy nhiên đã quá thời hạn sử dụng{result.expiry_date ? ` (hết hạn ngày ${result.expiry_date})` : ""}.
                  </p>
                </div>
              </div>
            )}

            {result.status === "UNVERIFIED" && (
              <div className="result-phase-1" style={{
                background: "var(--warning-bg)",
                border: "1px solid rgba(245, 158, 11, 0.45)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                marginBottom: "22px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "14px",
                flexWrap: "wrap"
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1 }}>
                  <div style={{ background: "#d97706", borderRadius: "50%", padding: "6px", display: "flex", marginTop: "2px", color: "#ffffff" }}>
                    <ShieldAlert size={22} color="#ffffff" />
                  </div>
                  <div>
                    <h4 style={{ color: "var(--warning-text)", fontWeight: 800, fontSize: "16px" }}>
                      Chưa Thể Xác Minh Đầy Đủ
                    </h4>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "2px" }}>
                      Hệ thống tạm thời chưa đối chiếu đủ dữ liệu gốc và tài liệu PDF nên chưa thể kết luận chứng chỉ này hợp lệ. Vui lòng thử lại sau ít phút.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSearch(result.certificate_code)}
                  className="btn btn-outline"
                  style={{ fontSize: "12.5px", padding: "7px 14px", flexShrink: 0 }}
                >
                  <RefreshCw size={14} /> Thử Kiểm Tra Lại
                </button>
              </div>
            )}

            {result.status === "REVOKED" && (
              <div className="result-phase-1" style={{
                background: "var(--danger-bg)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                marginBottom: "22px",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px"
              }}>
                <div style={{ background: "var(--danger-color)", borderRadius: "50%", padding: "6px", display: "flex", marginTop: "2px", color: "#ffffff" }}>
                  <XCircle size={24} color="#ffffff" />
                </div>
                <div>
                  <h4 style={{ color: "var(--danger-text)", fontWeight: 800, fontSize: "16px" }}>Chứng Chỉ Đã Bị Thu Hồi</h4>
                  <p style={{ color: "var(--danger-text)", fontSize: "13px", marginTop: "2px", fontWeight: 600 }}>
                    Lý do thu hồi: {result.revoked_reason || "Vi phạm quy chế thi cử"}
                  </p>
                  {result.revoked_at && (
                    <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>
                      Thời điểm thu hồi: {result.revoked_at}
                    </p>
                  )}
                </div>
              </div>
            )}

            {result.status === "TAMPERED" && (
              <div className="result-phase-1" style={{
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.5)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                marginBottom: "22px",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px"
              }}>
                <div style={{ background: "#f59e0b", borderRadius: "50%", padding: "6px", display: "flex", marginTop: "2px", color: "#ffffff" }}>
                  <AlertTriangle size={24} color="#ffffff" />
                </div>
                <div>
                  <h4 style={{ color: "#d97706", fontWeight: 800, fontSize: "16px" }}>Cảnh Báo: Thông Tin Chứng Chỉ Không Khớp</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "2px" }}>
                    Nội dung hiển thị không trùng khớp với hồ sơ gốc đã cấp phát. Vui lòng liên hệ Trung tâm Khảo thí để xác minh lại.
                  </p>
                  {result.tamper_details && (
                    <p style={{ color: "#d97706", fontSize: "12px", fontWeight: 600, marginTop: "6px" }}>
                      Chi tiết sai lệch: {result.tamper_details}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="result-phase-2">
              <CertificateCard cert={result} />
            </div>

            <div className="result-phase-3" style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
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
                Tải Bản PDF
              </button>

              <button type="button" onClick={handleCopyShareLink} className="btn btn-outline">
                {copiedLink ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} />}
                {copiedLink ? "Đã Sao Chép Link" : "Sao Chép Link Tra Cứu"}
              </button>

              <button type="button" onClick={handleReset} className="btn btn-outline">
                Tra Cứu Mã Khác
              </button>
            </div>
          </div>
        )}

        {activeTab === "code" && !loading && hasSearched && !result && (
          <div className="glass-panel result-phase-1" style={{ padding: "36px", textAlign: "center", marginTop: "24px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--warning-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <AlertTriangle size={26} color="var(--warning-text)" />
            </div>
            <h3 style={{ fontSize: "19px", fontWeight: 800, color: "var(--warning-text)" }}>Không Tìm Thấy Chứng Chỉ Này</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "500px", margin: "8px auto 0" }}>
              Không tìm thấy chứng chỉ nào ứng với mã <strong>"{inputCode}"</strong>. Vui lòng kiểm tra lại mã đã nhập hoặc quét lại mã QR in trên văn bằng.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default CertificateVerifier;
