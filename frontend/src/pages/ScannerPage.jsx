import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { QrCode, Camera, Upload, ArrowLeft, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function ScannerPage() {
  const navigate = useNavigate();
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        setErrorMsg("");
        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // bỏ qua frame chưa nhận dạng
          }
        );
        setCameraActive(true);
      } catch (err) {
        console.warn("Camera init:", err);
        setErrorMsg("Không thể mở Camera thiết bị (do chưa cấp quyền hoặc không có webcam). Bạn có thể dùng tính năng Tải ảnh QR hoặc chọn Mã Mẫu bên dưới.");
        setCameraActive(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleScanSuccess = (text) => {
    let certCode = text;
    try {
      if (text.includes("code=")) {
        const url = new URL(text);
        certCode = url.searchParams.get("code") || text;
      }
    } catch (e) {
      certCode = text;
    }

    setScanResult(certCode);

    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }

    setTimeout(() => {
      navigate(`/verify?code=${encodeURIComponent(certCode)}`);
    }, 800);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("file-reader-hidden");
    html5QrCode
      .scanFile(file, true)
      .then((decodedText) => {
        handleScanSuccess(decodedText);
      })
      .catch((err) => {
        setErrorMsg("Không tìm thấy mã QR hợp lệ trong bức ảnh này. Vui lòng chọn ảnh chụp rõ nét hơn.");
      });
  };

  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div className="container" style={{ maxWidth: "620px" }}>
        
        <div style={{ marginBottom: "20px" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "14px", fontWeight: 500 }}>
            <ArrowLeft size={16} /> Quay lại trang chủ
          </Link>
        </div>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px var(--primary-glow)",
            marginBottom: "16px"
          }}>
            <QrCode size={30} color="#04121e" />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)" }}>
            Quét Mã QR Xác Thực
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Hướng camera vào mã QR in trên bằng giấy để đối soát trực tiếp tính hợp lệ với Smart Contract.
          </p>
        </div>

        {/* Viewport Box */}
        <div className="glass-panel" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
          
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "360px",
            height: "360px",
            margin: "0 auto",
            background: "#050811",
            borderRadius: "16px",
            overflow: "hidden",
            border: "2px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* HTML5 QR Code Mount point */}
            <div id="reader" style={{ width: "100%", height: "100%" }} />
            <div id="file-reader-hidden" style={{ display: "none" }} />

            {/* Laser Scanning Animation */}
            {cameraActive && !scanResult && <div className="laser-beam" />}

            {/* Success Overlay */}
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
                <CheckCircle2 size={56} />
                <div style={{ fontWeight: 800, fontSize: "17px", marginTop: "12px" }}>ĐÃ NHẬN DIỆN MÃ QR!</div>
                <div style={{ fontSize: "13px", marginTop: "4px" }}>Đang chuyển đến kết quả: {scanResult}</div>
              </div>
            )}
          </div>

          {/* Fallback & Upload Area */}
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <label className="btn btn-outline" style={{ cursor: "pointer", display: "inline-flex" }}>
              <Upload size={16} />
              Tải Ảnh Chụp Mã QR Từ Máy
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
          </div>

          {/* Quick Demo Test Trigger */}
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Hoặc quét nhanh mã demo kiểm thử:</span>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleScanSuccess("CERT-IELTS-2026-001")}
                className="btn btn-primary"
                style={{ fontSize: "12px", padding: "6px 14px" }}
              >
                Mã Mẫu IELTS (8.0)
              </button>
              <button
                type="button"
                onClick={() => handleScanSuccess("CERT-VSTEP-2026-012")}
                className="btn btn-danger"
                style={{ fontSize: "12px", padding: "6px 14px" }}
              >
                Mã Mẫu Bị Thu Hồi
              </button>
            </div>
          </div>

        </div>

        {errorMsg && (
          <div style={{
            marginTop: "20px",
            background: "var(--warning-bg)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            color: "var(--warning-text)",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px"
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{errorMsg}</span>
          </div>
        )}

      </div>
    </div>
  );
}
