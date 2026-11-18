import React, { useEffect, useState } from "react";
import {
  Award,
  QrCode,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  UploadCloud,
  RefreshCw,
  Eye,
  ShieldCheck
} from "lucide-react";
import QRCode from "qrcode";
import { shortenAddress } from "../services/web3Service";
import { detectCourseType } from "../services/scoreEngine";
import koheniLogo from "../assets/koheni-logo.png";

const formatDate = (d) => {
  if (!d) return "—";
  const str = String(d).slice(0, 10);
  const p = str.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : str;
};

const hasValue = (v) => v !== null && v !== undefined && v !== "";

function CornerOrnament({ position }) {
  const styles = {
    tl: { top: "14px", left: "14px", transform: "none" },
    tr: { top: "14px", right: "14px", transform: "scaleX(-1)" },
    bl: { bottom: "14px", left: "14px", transform: "scaleY(-1)" },
    br: { bottom: "14px", right: "14px", transform: "scale(-1, -1)" }
  }[position];

  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
      style={{ position: "absolute", pointerEvents: "none", ...styles }}
    >
      <path d="M2 24V5C2 3.343 3.343 2 5 2H24" stroke="#c59334" strokeWidth="1.6" />
      <path d="M6 18V8C6 6.895 6.895 6 8 6H18" stroke="#c59334" strokeWidth="0.9" opacity="0.65" />
      <circle cx="6" cy="6" r="1.8" fill="#c59334" />
    </svg>
  );
}

export default function CertificateCard({ cert, isPreview = false }) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let active = true;
    if (!cert?.certificate_code) {
      setQrDataUrl("");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
    const verifyUrl = `${origin}/verify?code=${encodeURIComponent(cert.certificate_code)}`;
    QRCode.toDataURL(verifyUrl, {
      width: 160,
      margin: 1,
      color: { dark: "#0e2a47", light: "#ffffff" }
    })
      .then((url) => { if (active) setQrDataUrl(url); })
      .catch(() => { if (active) setQrDataUrl(""); });
    return () => { active = false; };
  }, [cert?.certificate_code]);

  if (!cert) return null;

  const isTampered = cert.status === "TAMPERED";
  const isUnverified = cert.status === "UNVERIFIED";
  const isRejected = cert.status === "REJECTED";
  const isRevoked = cert.status === "REVOKED";
  const isReadyToMint = cert.status === "READY_TO_MINT";
  const isPendingReconcile = cert.status === "PENDING_RECONCILE";
  const isPending = cert.status === "PENDING";
  const isDraftOrPreview = isPreview || cert.status === "DRAFT" || !cert.status;

  // Chỉ tính hết hạn cho chứng chỉ đã phát hành, tính theo cuối ngày (23:59:59 giờ địa phương)
  const isExpiredByDate = (() => {
    if (!cert.expiry_date) return false;
    if (cert.status !== "ISSUED_ON_CHAIN" && cert.status !== "EXPIRED") return false;
    const expiryStr = String(cert.expiry_date).slice(0, 10);
    const expiryMs = new Date(`${expiryStr}T23:59:59`).getTime();
    return !Number.isNaN(expiryMs) && expiryMs < Date.now();
  })();

  const isExpired = cert.status === "EXPIRED" || isExpiredByDate;
  const isIssued =
    (cert.status === "ISSUED_ON_CHAIN" ||
      cert.status === "REVOKED" ||
      cert.status === "TAMPERED" ||
      cert.status === "EXPIRED" ||
      cert.status === "UNVERIFIED") &&
    !isPreview;
  const isValidActive = cert.status === "ISSUED_ON_CHAIN" && !isExpired && !isRevoked && !isPreview;

  // Điểm tổng & kỹ năng (hỗ trợ cả score / score_overall và giá trị 0, ẩn W/S với TOEIC)
  const overallScore = hasValue(cert.score) ? cert.score : hasValue(cert.score_overall) ? cert.score_overall : "";
  const listeningVal = hasValue(cert.listening) ? cert.listening : hasValue(cert.score_listening) ? cert.score_listening : "";
  const readingVal = hasValue(cert.reading) ? cert.reading : hasValue(cert.score_reading) ? cert.score_reading : "";
  const writingVal = hasValue(cert.writing) ? cert.writing : hasValue(cert.score_writing) ? cert.score_writing : "";
  const speakingVal = hasValue(cert.speaking) ? cert.speaking : hasValue(cert.score_speaking) ? cert.score_speaking : "";

  const isToeic = detectCourseType(cert.course_code, cert.score_type) === "TOEIC";
  const skillItems = isToeic
    ? [
        { label: "Listening", value: listeningVal },
        { label: "Reading", value: readingVal }
      ]
    : [
        { label: "Listening", value: listeningVal },
        { label: "Reading", value: readingVal },
        { label: "Writing", value: writingVal },
        { label: "Speaking", value: speakingVal }
      ];

  const hasToken = hasValue(cert.token_id);

  const badgeBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 12px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.3px"
  };

  const renderStatusBadge = () => {
    if (isTampered) {
      return (
        <div style={{ ...badgeBase, background: "#fef3c7", color: "#92400e", border: "1px solid #f59e0b" }}>
          <AlertTriangle size={13} />
          SAI LỆCH DỮ LIỆU (TAMPERED)
        </div>
      );
    }
    if (isRejected) {
      return (
        <div style={{ ...badgeBase, background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}>
          <XCircle size={13} />
          HỒ SƠ BỊ TỪ CHỐI PHÊ DUYỆT
        </div>
      );
    }
    if (isDraftOrPreview) {
      return (
        <div style={{ ...badgeBase, background: "#fef9e7", color: "#9a6700", border: "1px dashed #d4a017" }}>
          <Eye size={13} />
          BẢN XEM TRƯỚC – CHƯA PHÁT HÀNH
        </div>
      );
    }
    if (isPendingReconcile) {
      return (
        <div style={{ ...badgeBase, background: "#ffedd5", color: "#c2410c", border: "1px solid #fdba74" }}>
          <RefreshCw size={13} />
          CHỜ ĐỐI SOÁT GIAO DỊCH
        </div>
      );
    }
    if (isReadyToMint) {
      return (
        <div style={{ ...badgeBase, background: "#e0f2fe", color: "#0369a1", border: "1px solid #7dd3fc" }}>
          <UploadCloud size={13} />
          SẴN SÀNG KÝ CẤP (IPFS READY)
        </div>
      );
    }
    if (isPending) {
      return (
        <div style={{ ...badgeBase, background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}>
          <Clock size={13} />
          ĐANG CHỜ PHÊ DUYỆT
        </div>
      );
    }
    if (isRevoked) {
      return (
        <div style={{ ...badgeBase, background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}>
          <XCircle size={13} />
          ĐÃ BỊ THU HỒI (REVOKED)
        </div>
      );
    }
    if (isUnverified) {
      return (
        <div style={{ ...badgeBase, background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}>
          <AlertTriangle size={13} />
          CHƯA THỂ XÁC MINH TRÊN BLOCKCHAIN
        </div>
      );
    }
    if (isValidActive) {
      return (
        <div style={{ ...badgeBase, background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }}>
          <CheckCircle2 size={13} />
          HỢP LỆ &amp; CÒN HIỆU LỰC
        </div>
      );
    }
    return (
      <div style={{ ...badgeBase, background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" }}>
        <Calendar size={13} />
        HẾT HẠN HIỆU LỰC (EXPIRED)
      </div>
    );
  };

  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(155deg, #fffdf8 0%, #ffffff 48%, #fbf6ea 100%)",
      border: "3px solid #0e2a47",
      borderRadius: "14px",
      padding: "32px 36px 26px",
      boxShadow: "0 22px 54px -18px rgba(14, 42, 71, 0.28), 0 4px 16px rgba(14, 42, 71, 0.08)",
      color: "#0e2a47",
      overflow: "hidden",
      maxWidth: "760px",
      margin: "0 auto"
    }}>
      {/* Inner Ceremonial Gold Double Frame */}
      <div style={{
        position: "absolute",
        top: "8px",
        left: "8px",
        right: "8px",
        bottom: "8px",
        border: "1.5px solid #c59334",
        borderRadius: "8px",
        pointerEvents: "none"
      }} />

      {/* 4 Classical Gold Corner Flourishes */}
      <CornerOrnament position="tl" />
      <CornerOrnament position="tr" />
      <CornerOrnament position="bl" />
      <CornerOrnament position="br" />

      {/* Faint Ceremonial Watermark */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: 0.045,
        pointerEvents: "none"
      }}>
        <Award size={390} color="#b88628" />
      </div>

      {/* Header of Diploma */}
      <div style={{ textAlign: "center", marginBottom: "18px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
          <img
            src={koheniLogo}
            alt="Koheni — English Certificate & Management"
            style={{ height: "38px", width: "auto", display: "block" }}
          />
        </div>

        {/* Classic Gold Hairline Divider */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
          <span style={{ width: "64px", height: "1px", background: "linear-gradient(90deg, transparent, #c59334)" }} />
          <span style={{ width: "6px", height: "6px", background: "#c59334", transform: "rotate(45deg)", display: "inline-block" }} />
          <span style={{ width: "64px", height: "1px", background: "linear-gradient(90deg, #c59334, transparent)" }} />
        </div>

        <h2 style={{
          fontFamily: "var(--font-serif)",
          fontSize: "27px",
          fontWeight: 700,
          color: "#0e2a47",
          letterSpacing: "1.4px",
          marginBottom: "4px"
        }}>
          CERTIFICATE OF PROFICIENCY
        </h2>
        <p style={{ color: "#64748b", fontSize: "11.5px", fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase" }}>
          Chứng Chỉ Khảo Thí Tiếng Anh Quốc Tế
        </p>
      </div>

      {/* Recipient Block */}
      <div style={{ textAlign: "center", margin: "18px 0 16px", position: "relative" }}>
        <p style={{ color: "#64748b", fontSize: "12px", fontStyle: "italic", fontFamily: "var(--font-serif)" }}>
          This is to certify that / Chứng nhận học viên
        </p>
        <h3 style={{
          fontFamily: "var(--font-serif)",
          fontSize: "30px",
          fontWeight: 700,
          color: cert.student_name ? "#0b2239" : "#94a3b8",
          fontStyle: cert.student_name ? "normal" : "italic",
          margin: "6px 0 4px",
          letterSpacing: "0.2px"
        }}>
          {cert.student_name || "[Chưa chọn học viên]"}
        </h3>
        <div style={{ width: "136px", height: "1.5px", background: "linear-gradient(90deg, transparent, #c59334, transparent)", margin: "6px auto 8px" }} />
        <p style={{ color: "#475569", fontSize: "12.5px" }}>
          Mã học viên: <strong style={{ color: cert.student_code ? "#0e2a47" : "#94a3b8", fontFamily: "monospace" }}>{cert.student_code || "[Chưa có mã]"}</strong>
        </p>
      </div>

      {/* Examination & Official Score Sheet Panel */}
      <div style={{
        background: "#faf6ec",
        border: "1px solid rgba(197, 147, 52, 0.38)",
        borderRadius: "10px",
        padding: "16px 20px",
        margin: "16px 0 20px",
        textAlign: "center",
        position: "relative"
      }}>
        <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", marginBottom: "3px" }}>
          has successfully completed and demonstrated proficiency in
        </div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: cert.course_name ? "#0e2a47" : "#94a3b8", marginBottom: "14px", letterSpacing: "0.2px" }}>
          {cert.course_name || "[Chưa chọn khóa học / kỳ thi]"}
        </div>

        {/* Prestigious Navy & Gold Overall Score Banner */}
        <div style={{
          background: "linear-gradient(135deg, #0e2a47 0%, #174066 100%)",
          border: "1px solid #c59334",
          borderRadius: "8px",
          padding: "10px 16px",
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          flexWrap: "wrap",
          boxShadow: "0 6px 16px -8px rgba(14, 42, 71, 0.45)"
        }}>
          <span style={{ fontSize: "10.5px", color: "#f6d88b", fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" }}>
            OVERALL SCORE
          </span>
          <span style={{ fontSize: "20px", fontWeight: 800, color: overallScore ? "#ffffff" : "#94a3b8" }}>
            {overallScore || "—"}
          </span>
        </div>

        {/* Crisp White Component Skill Cells (2 cols for TOEIC, 4 cols for 4-skill exams) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${skillItems.length}, minmax(0, 1fr))`,
          gap: "8px"
        }}>
          {skillItems.map((sk) => (
            <div key={sk.label} style={{
              background: "#ffffff",
              border: "1px solid #e7decb",
              padding: "8px 6px",
              borderRadius: "7px"
            }}>
              <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                {sk.label}
              </div>
              <div style={{ fontSize: "15.5px", fontWeight: 800, color: hasValue(sk.value) ? "#0e2a47" : "#94a3b8", marginTop: "2px" }}>
                {hasValue(sk.value) ? sk.value : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ceremonial Footer: Status/Dates | Digital Director Seal | Real QR Code */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 0.9fr auto",
        alignItems: "center",
        gap: "16px",
        paddingTop: "16px",
        borderTop: "1px solid rgba(197, 147, 52, 0.3)",
        position: "relative"
      }}>
        {/* Left: Status Badge & Certificate Dates */}
        <div>
          <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, marginBottom: "6px", letterSpacing: "0.8px" }}>
            TRẠNG THÁI HIỆU LỰC
          </div>
          {renderStatusBadge()}

          <div style={{ fontSize: "11.5px", color: "#475569", marginTop: "9px", lineHeight: 1.65 }}>
            <div>
              Mã bằng: <strong style={{ color: "#0e2a47", fontFamily: "monospace" }}>{cert.certificate_code || "—"}</strong>
            </div>
            <div>
              Ngày cấp: <strong style={{ color: "#0e2a47" }}>{formatDate(cert.issue_date)}</strong>
            </div>
            <div>
              Hạn hiệu lực:{" "}
              <strong style={{ color: isExpired ? "#b91c1c" : "#0e2a47" }}>
                {cert.expiry_date ? formatDate(cert.expiry_date) : "Vô thời hạn"}
              </strong>
            </div>
          </div>
        </div>

        {/* Center: Official Director Digital Seal (Echoes A4 PDF) */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            margin: "0 auto 6px",
            background: "radial-gradient(circle at 35% 35%, #f8e2a2 0%, #d4a23d 60%, #a8761c 100%)",
            border: "2px solid #fffdf8",
            boxShadow: "0 0 0 1.5px #c59334, 0 6px 14px -4px rgba(168, 118, 28, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff"
          }}>
            <ShieldCheck size={22} />
          </div>
          <div style={{ fontSize: "10.5px", fontWeight: 800, color: "#0e2a47", letterSpacing: "0.8px" }}>
            CENTER DIRECTOR
          </div>
          <div style={{ fontSize: "9.5px", fontWeight: 700, color: isValidActive ? "#15803d" : "#8a6d3b", marginTop: "2px", letterSpacing: "0.5px" }}>
            {isIssued ? "[DIGITALLY VERIFIED]" : "[KOHENI SEAL]"}
          </div>
        </div>

        {/* Right: Framed Scannable QR Code */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            background: "#ffffff",
            padding: "5px",
            borderRadius: "8px",
            border: "1.5px solid #d9c598",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(14, 42, 71, 0.08)"
          }}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Mã QR xác thực ${cert.certificate_code}`}
                style={{ width: "74px", height: "74px", display: "block", borderRadius: "3px" }}
              />
            ) : (
              <QrCode size={66} color="#0e2a47" />
            )}
          </div>
          <div style={{ fontSize: "9.5px", color: "#8a6118", marginTop: "4px", fontWeight: 700, letterSpacing: "0.4px" }}>
            {isIssued ? "QUÉT XÁC THỰC" : "QR XEM TRƯỚC"}
          </div>
        </div>
      </div>

      {/* Bottom On-Chain Proof Strip */}
      <div style={{
        marginTop: "16px",
        padding: "9px 14px",
        background: "#f3eee1",
        border: "1px solid rgba(197, 147, 52, 0.25)",
        borderRadius: "8px",
        fontSize: "11px",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px 16px",
        color: "#475569",
        position: "relative"
      }}>
        <span>
          Mã số bằng:{" "}
          <strong style={{ color: isIssued && hasToken ? "#0369a1" : "#64748b" }}>
            {isIssued && hasToken
              ? `#${cert.token_id}`
              : isRejected
              ? "Không phát hành"
              : isPendingReconcile
              ? "Chờ đối soát"
              : "Chưa phát hành"}
          </strong>
        </span>
        <span>
          Mã xác thực:{" "}
          <span style={{ color: isIssued && cert.tx_hash ? "#0e2a47" : "#64748b", fontFamily: cert.tx_hash ? "monospace" : "inherit", fontWeight: 600 }}>
            {isIssued && cert.tx_hash
              ? shortenAddress(cert.tx_hash)
              : isRejected
              ? "Đã từ chối"
              : "Chưa phát sinh"}
          </span>
        </span>
        <span>
          Mã lưu trữ:{" "}
          <span style={{ color: cert.ipfs_hash && !isRejected ? "#9a6700" : "#64748b", fontFamily: cert.ipfs_hash ? "monospace" : "inherit", fontWeight: 600 }}>
            {cert.ipfs_hash && !isRejected
              ? `${cert.ipfs_hash.slice(0, 10)}...`
              : isRejected
              ? "Không lưu trữ"
              : "Chưa lưu trữ"}
          </span>
        </span>
      </div>
    </div>
  );
}
