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
  Eye
} from "lucide-react";
import QRCode from "qrcode";
import { shortenAddress } from "../services/web3Service";
import { detectCourseType } from "../services/scoreEngine";
import koheniLogoWhite from "../assets/koheni-logo-white.png";

const formatDate = (d) => {
  if (!d) return "—";
  const str = String(d).slice(0, 10);
  const p = str.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : str;
};

const hasValue = (v) => v !== null && v !== undefined && v !== "";

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
      color: { dark: "#0f172a", light: "#ffffff" }
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

  const renderStatusBadge = () => {
    if (isTampered) {
      return (
        <div className="badge badge-danger" style={{ fontSize: "12px", padding: "6px 14px", background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.5)" }}>
          <AlertTriangle size={14} />
          SAI LỆCH DỮ LIỆU (TAMPERED)
        </div>
      );
    }
    if (isRejected) {
      return (
        <div className="badge badge-danger" style={{ fontSize: "12px", padding: "6px 14px" }}>
          <XCircle size={14} />
          HỒ SƠ BỊ TỪ CHỐI PHÊ DUYỆT
        </div>
      );
    }
    if (isDraftOrPreview) {
      return (
        <div className="badge badge-warning" style={{ fontSize: "12px", padding: "6px 14px", background: "rgba(245, 158, 11, 0.18)", color: "#fbbf24", border: "1px dashed rgba(245, 158, 11, 0.45)" }}>
          <Eye size={14} />
          BẢN XEM TRƯỚC – CHƯA PHÁT HÀNH
        </div>
      );
    }
    if (isPendingReconcile) {
      return (
        <div className="badge badge-warning" style={{ fontSize: "12px", padding: "6px 14px", background: "rgba(249, 115, 22, 0.2)", color: "#fdba74", border: "1px solid rgba(249, 115, 22, 0.45)" }}>
          <RefreshCw size={14} />
          CHỜ ĐỐI SOÁT GIAO DỊCH
        </div>
      );
    }
    if (isReadyToMint) {
      return (
        <div className="badge badge-info" style={{ fontSize: "12px", padding: "6px 14px", background: "rgba(56, 189, 248, 0.18)", color: "#7dd3fc", border: "1px solid rgba(56, 189, 248, 0.45)" }}>
          <UploadCloud size={14} />
          SẴN SÀNG KÝ CẤP (IPFS READY)
        </div>
      );
    }
    if (isPending) {
      return (
        <div className="badge badge-warning" style={{ fontSize: "12px", padding: "6px 14px" }}>
          <Clock size={14} />
          ĐANG CHỜ PHÊ DUYỆT
        </div>
      );
    }
    if (isRevoked) {
      return (
        <div className="badge badge-danger" style={{ fontSize: "12px", padding: "6px 14px" }}>
          <XCircle size={14} />
          ĐÃ BỊ THU HỒI (REVOKED)
        </div>
      );
    }
    if (isUnverified) {
      return (
        <div className="badge badge-warning" style={{ fontSize: "12px", padding: "6px 14px" }}>
          <AlertTriangle size={14} />
          CHƯA THỂ XÁC MINH TRÊN BLOCKCHAIN
        </div>
      );
    }
    if (isValidActive) {
      return (
        <div className="badge badge-success" style={{ fontSize: "12px", padding: "6px 14px" }}>
          <CheckCircle2 size={14} />
          HỢP LỆ &amp; CÒN HIỆU LỰC
        </div>
      );
    }
    return (
      <div className="badge badge-warning" style={{ fontSize: "12px", padding: "6px 14px" }}>
        <Calendar size={14} />
        HẾT HẠN HIỆU LỰC (EXPIRED)
      </div>
    );
  };

  return (
    <div style={{
      position: "relative",
      background:
        "radial-gradient(circle at 92% 8%, rgba(56, 189, 248, 0.14) 0%, transparent 45%), linear-gradient(145deg, #0c1829 0%, #091322 100%)",
      border: "2px solid #b45309",
      borderRadius: "16px",
      padding: "32px 36px",
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.38), inset 0 0 40px rgba(180, 83, 9, 0.08)",
      color: "#f8fafc",
      overflow: "hidden",
      maxWidth: "750px",
      margin: "0 auto"
    }}>
      {/* Classical Decorative Inner Border */}
      <div style={{
        position: "absolute",
        top: "8px",
        left: "8px",
        right: "8px",
        bottom: "8px",
        border: "1px dashed rgba(245, 158, 11, 0.35)",
        borderRadius: "12px",
        pointerEvents: "none"
      }} />

      {/* Watermark in background */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: 0.035,
        pointerEvents: "none"
      }}>
        <Award size={400} color="#f59e0b" />
      </div>

      {/* Header of Certificate */}
      <div style={{ textAlign: "center", marginBottom: "22px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
          <img
            src={koheniLogoWhite}
            alt="Koheni English Testing Center"
            style={{ height: "34px", width: "auto", display: "block", opacity: 0.96 }}
          />
        </div>
        <h2 style={{
          fontFamily: "var(--font-serif)",
          fontSize: "26px",
          fontWeight: 700,
          color: "#fef3c7",
          letterSpacing: "1px",
          marginBottom: "4px"
        }}>
          CERTIFICATE OF PROFICIENCY
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "12.5px" }}>
          Chứng Chỉ Khảo Thí Tiếng Anh Điện Tử Định Danh Bất Biến
        </p>
      </div>

      {/* Recipient info */}
      <div style={{ textAlign: "center", margin: "20px 0", position: "relative" }}>
        <p style={{ color: "#94a3b8", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "1.5px" }}>
          Chứng nhận học viên (This is to certify that)
        </p>
        <h3 style={{
          fontFamily: "var(--font-serif)",
          fontSize: "29px",
          fontWeight: 700,
          color: cert.student_name ? "#38bdf8" : "#64748b",
          fontStyle: cert.student_name ? "normal" : "italic",
          margin: "8px 0"
        }}>
          {cert.student_name || "[Chưa chọn học viên]"}
        </h3>
        <p style={{ color: "#94a3b8", fontSize: "13px" }}>
          Mã học viên: <strong style={{ color: cert.student_code ? "#f8fafc" : "#64748b", fontFamily: "monospace" }}>{cert.student_code || "[Chưa có mã]"}</strong>
        </p>
      </div>

      {/* Course & Score highlight (Responsive Overall Banner + Clean 2-col TOEIC / 4-col Skill Grid) */}
      <div style={{
        background: "rgba(15, 23, 42, 0.72)",
        border: "1px solid rgba(245, 158, 11, 0.26)",
        borderRadius: "12px",
        padding: "16px 20px",
        margin: "20px 0",
        textAlign: "center",
        position: "relative"
      }}>
        <div style={{ fontSize: "12.5px", color: "#94a3b8", marginBottom: "4px" }}>
          Đã hoàn thành xuất sắc kỳ thi:
        </div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: cert.course_name ? "#fde68a" : "#64748b", marginBottom: "14px" }}>
          {cert.course_name || "[Chưa chọn khóa học / kỳ thi]"}
        </div>

        {/* Featured Overall Result Strip */}
        <div style={{
          background: "rgba(2, 132, 199, 0.14)",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          borderRadius: "10px",
          padding: "10px 14px",
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap"
        }}>
          <span style={{ fontSize: "11px", color: "#7dd3fc", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
            OVERALL SCORE
          </span>
          <span style={{ fontSize: "20px", fontWeight: 800, color: overallScore ? "#38bdf8" : "#64748b" }}>
            {overallScore || "—"}
          </span>
        </div>

        {/* Component Skills Table (2 cols for TOEIC, 4 cols for IELTS/VSTEP/Cambridge/TOEFL) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${skillItems.length}, minmax(0, 1fr))`,
          gap: "8px"
        }}>
          {skillItems.map((sk) => (
            <div key={sk.label} style={{ background: "rgba(0, 0, 0, 0.24)", padding: "8px 6px", borderRadius: "8px" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{sk.label}</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: hasValue(sk.value) ? "#f8fafc" : "#64748b", marginTop: "2px" }}>
                {hasValue(sk.value) ? sk.value : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer of Certificate: Status, Dates & Real Scannable QR Code */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        marginTop: "22px",
        paddingTop: "18px",
        borderTop: "1px solid rgba(255, 255, 255, 0.09)",
        position: "relative"
      }}>
        {/* Verification Status Badge & Dates */}
        <div>
          <div style={{ fontSize: "10.5px", color: "#94a3b8", marginBottom: "6px", letterSpacing: "0.6px" }}>
            TRẠNG THÁI HIỆU LỰC
          </div>
          {renderStatusBadge()}

          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "10px", lineHeight: 1.6 }}>
            <div>
              Mã bằng: <span style={{ color: "#f8fafc", fontWeight: 600, fontFamily: "monospace" }}>{cert.certificate_code || "—"}</span>
            </div>
            <div>
              Ngày cấp: <span style={{ color: "#f8fafc" }}>{formatDate(cert.issue_date)}</span>
              <span style={{ margin: "0 8px", opacity: 0.45 }}>•</span>
              Hạn hiệu lực:{" "}
              <span style={{ color: isExpired ? "#fca5a5" : "#f8fafc", fontWeight: isExpired ? 700 : 500 }}>
                {cert.expiry_date ? formatDate(cert.expiry_date) : "Vô thời hạn"}
              </span>
            </div>
          </div>
        </div>

        {/* Real Scannable QR Code */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            background: "#ffffff",
            padding: "6px",
            borderRadius: "10px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.45)"
          }}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Mã QR xác thực ${cert.certificate_code}`}
                style={{ width: "76px", height: "76px", display: "block", borderRadius: "4px" }}
              />
            ) : (
              <QrCode size={68} color="#000000" />
            )}
          </div>
          <div style={{ fontSize: "10px", color: "#fbbf24", marginTop: "5px", fontWeight: 600 }}>
            {isIssued ? "QUÉT ĐỐI SOÁT XÁC THỰC" : "MÃ QR XEM TRƯỚC"}
          </div>
        </div>
      </div>

      {/* Verification details banner (Responsive wrap + accurate status labels) */}
      <div style={{
        marginTop: "16px",
        padding: "10px 14px",
        background: "rgba(0, 0, 0, 0.36)",
        borderRadius: "8px",
        fontSize: "11px",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px 16px",
        color: "#94a3b8",
        position: "relative"
      }}>
        <span>
          Mã số bằng:{" "}
          <strong style={{ color: isIssued && hasToken ? "#38bdf8" : "#94a3b8" }}>
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
          <span style={{ color: isIssued && cert.tx_hash ? "#cbd5e1" : "#94a3b8", fontFamily: cert.tx_hash ? "monospace" : "inherit" }}>
            {isIssued && cert.tx_hash
              ? shortenAddress(cert.tx_hash)
              : isRejected
              ? "Đã từ chối"
              : "Chưa phát sinh"}
          </span>
        </span>
        <span>
          Mã lưu trữ:{" "}
          <span style={{ color: cert.ipfs_hash && !isRejected ? "#fbbf24" : "#94a3b8", fontFamily: cert.ipfs_hash ? "monospace" : "inherit" }}>
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
