import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ShieldCheck, AlertTriangle, XCircle, Download, QrCode, RefreshCw, Copy, Check, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { getCertificateByCode } from "../services/web3Service";
import CertificateCard from "./CertificateCard";

export default function CertificateVerifier({ syncUrl = false }) {
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
    <div style={{ maxWidth: "740px", margin: "0 auto", textAlign: "left" }}>
      {/* Single-row Spotlight Search Capsule (Input + inline QR Toggle + Verify CTA) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="search-spotlight-bar"
      >
        <Search size={19} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Nhập mã chứng chỉ cần tra cứu..."
          value={inputCode}
          onChange={(e) => {
            setInputCode(e.target.value);
            if (activeTab === "qr") setActiveTab("code");
          }}
          className="search-spotlight-input"
        />

        <div style={{ width: "1px", height: "24px", background: "var(--border-subtle)", flexShrink: 0 }} />

        <button
          type="button"
          onClick={() => {
            const nextTab = activeTab === "qr" ? "code" : "qr";
            setActiveTab(nextTab);
            if (syncUrl) setSearchParams(nextTab === "qr" ? { tab: "qr" } : (inputCode ? { code: inputCode } : {}));
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            height: "42px",
            padding: "0 14px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            background: activeTab === "qr" ? "var(--primary-bg)" : "transparent",
            color: activeTab === "qr" ? "var(--primary)" : "var(--text-secondary)",
            transition: "all var(--transition-fast)",
            flexShrink: 0
          }}
          title="Quét mã QR bằng camera hoặc tải ảnh"
        >
          <QrCode size={16} />
          <span>Quét QR</span>
        </button>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ height: "44px", padding: "0 22px", borderRadius: "12px", fontSize: "14px", flexShrink: 0 }}
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Đang kiểm tra...
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              Thẩm Định
            </>
          )}
        </button>
      </form>

      {/* Slide-down Embedded QR Scanner Panel (Only visible when Quét QR is toggled on) */}
      {activeTab === "qr" && (
        <div className="glass-panel" style={{ padding: "24px", marginTop: "16px", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
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
                <div style={{ fontWeight: 800, fontSize: "15px", marginTop: "10px" }}>ĐÃ NHẬN DIỆN MÃ QR!</div>
                <div style={{ fontSize: "13px", marginTop: "4px" }}>Đang thẩm định: {scanResult}</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <label className="btn btn-outline" style={{ cursor: "pointer", display: "inline-flex", fontSize: "13px" }}>
              <Upload size={15} />
              Tải Ảnh Chụp Mã QR Từ Máy
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
          <div className="glass-panel" style={{ padding: "40px 20px", textAlign: "center", marginTop: "24px" }}>
            <div style={{ width: "44px", height: "44px", border: "4px solid var(--border-subtle)", borderTopColor: "var(--primary)", borderRadius: "50%", margin: "0 auto 14px", animation: "spinSlow 1s linear infinite" }} />
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>Đang đối soát chứng chỉ điện tử...</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>Xác thực chữ ký số và dữ liệu chứng chỉ trên hệ thống</p>
          </div>
        )}

        {activeTab === "code" && !loading && hasSearched && result && (
          <div style={{ marginTop: "28px" }}>
            {result.status === "ISSUED_ON_CHAIN" && (
              <div style={{
                background: "var(--success-bg)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                marginBottom: "22px",
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
                marginBottom: "22px",
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
                  {result.revoked_at && (
                    <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>
                      Thời điểm thu hồi: {result.revoked_at}
                    </p>
                  )}
                </div>
              </div>
            )}

            {result.status === "TAMPERED" && (
              <div style={{
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

            <CertificateCard cert={result} />

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
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

              <button type="button" onClick={handleCopyShareLink} className="btn btn-outline">
                {copiedLink ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} />}
                {copiedLink ? "Đã Copy Link Xác Thực" : "Chia Sẻ Link Xác Thực"}
              </button>

              <button type="button" onClick={handleReset} className="btn btn-outline">
                Tra Cứu Mã Khác
              </button>
            </div>
          </div>
        )}

        {activeTab === "code" && !loading && hasSearched && !result && (
          <div className="glass-panel" style={{ padding: "36px", textAlign: "center", marginTop: "24px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--warning-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <AlertTriangle size={26} color="var(--warning-text)" />
            </div>
            <h3 style={{ fontSize: "19px", fontWeight: 800, color: "var(--warning-text)" }}>Không Tìm Thấy Chứng Chỉ Này</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "500px", margin: "8px auto 0" }}>
              Mã chứng chỉ <strong>"{inputCode}"</strong> chưa từng được cấp phát hoặc không tồn tại trên hệ thống xác thực. Cẩn trọng với các bằng cấp giả mạo!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
