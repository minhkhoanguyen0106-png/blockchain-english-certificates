import React, { useEffect, useState } from "react";
import { Award, QrCode, Calendar, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import QRCode from "qrcode";
import { shortenAddress } from "../services/web3Service";

const formatDate = (d) => {
  if (!d) return "—";
  const str = String(d).slice(0, 10);
  const p = str.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : str;
};

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
  const isExpired = cert.status === "EXPIRED" || (cert.expiry_date && new Date(cert.expiry_date) < new Date());
  const isIssued = (cert.status === "ISSUED_ON_CHAIN" || cert.status === "REVOKED" || cert.status === "TAMPERED" || cert.status === "EXPIRED" || cert.status === "UNVERIFIED") && !isPreview;
  const isPending = cert.status === "PENDING";
  const isDraftOrPreview = isPreview || cert.status === "DRAFT" || !cert.status;
  const isValidActive = cert.status === "ISSUED_ON_CHAIN" && !isExpired && !isRevoked && !isPreview;

  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(145deg, #0b1120 0%, #080d1a 100%)",
      border: "2px solid #b45309",
      borderRadius: "16px",
      padding: "36px 40px",
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4), inset 0 0 40px rgba(180, 83, 9, 0.08)",
      color: "#f8fafc",
      overflow: "hidden",
      maxWidth: "750px",
      margin: "0 auto"
    }}>
      {/* Classical Decorative Borders */}
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

      {/* Watermark Logo in background */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: 0.04,
        pointerEvents: "none"
      }}>
        <Award size={420} color="#f59e0b" />
      </div>

      {/* Header of Certificate */}
      <div style={{ textAlign: "center", marginBottom: "24px", position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#f59e0b", marginBottom: "6px" }}>
          <Award size={22} />
          <span style={{ textTransform: "uppercase", letterSpacing: "3px", fontSize: "11px", fontWeight: 700 }}>
            Koheni English Testing Center
          </span>
          <Award size={22} />
        </div>
        <h2 style={{
          fontFamily: "var(--font-serif)",
          fontSize: "28px",
          fontWeight: 700,
          color: "#fef3c7",
          letterSpacing: "1px",
          marginBottom: "4px"
        }}>
          CERTIFICATE OF PROFICIENCY
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "13px" }}>
          Chứng Chỉ Khảo Thí Tiếng Anh Điện Tử Định Danh Bất Biến
        </p>
      </div>

      {/* Recipient info */}
      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <p style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px" }}>
          Chứng nhận học viên (This is to certify that)
        </p>
        <h3 style={{
          fontFamily: "var(--font-serif)",
          fontSize: "30px",
          fontWeight: 700,
          color: cert.student_name ? "#38bdf8" : "#64748b",
          fontStyle: cert.student_name ? "normal" : "italic",
          margin: "8px 0"
        }}>
          {cert.student_name || "[Chưa chọn học viên]"}
        </h3>
        <p style={{ color: "#94a3b8", fontSize: "13px" }}>
          Mã học viên: <strong style={{ color: cert.student_code ? "#f8fafc" : "#64748b" }}>{cert.student_code || "[Chưa có mã]"}</strong>
        </p>
      </div>

      {/* Course & Score highlight */}
      <div style={{
        background: "rgba(15, 23, 42, 0.7)",
        border: "1px solid rgba(245, 158, 11, 0.25)",
        borderRadius: "12px",
        padding: "16px 20px",
        margin: "20px 0",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>
          Đã hoàn thành xuất sắc kỳ thi:
        </div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: cert.course_name ? "#fde68a" : "#64748b", marginBottom: "12px" }}>
          {cert.course_name || "[Chưa chọn khóa học / kỳ thi]"}
        </div>
        
        {/* Scores Table */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginTop: "12px" }}>
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
            <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 600 }}>OVERALL</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: cert.score ? "#38bdf8" : "#64748b" }}>{cert.score || "—"}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Listening</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: (cert.listening || cert.score_listening) ? "#f8fafc" : "#64748b" }}>
              {cert.listening || cert.score_listening || "—"}
            </div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Reading</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: (cert.reading || cert.score_reading) ? "#f8fafc" : "#64748b" }}>
              {cert.reading || cert.score_reading || "—"}
            </div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Writing</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: (cert.writing || cert.score_writing) ? "#f8fafc" : "#64748b" }}>
              {cert.writing || cert.score_writing || "—"}
            </div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Speaking</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: (cert.speaking || cert.score_speaking) ? "#f8fafc" : "#64748b" }}>
              {cert.speaking || cert.score_speaking || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer of Certificate: QR Code & Verification Proof */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
        
        {/* Verification Status Badge */}
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>TRẠNG THÁI HIỆU LỰC</div>
          {isTampered ? (
            <div className="badge badge-danger" style={{ fontSize: "12px", padding: "6px 14px", background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.5)" }}>
              <AlertTriangle size={15} />
              SAI LỆCH DỮ LIỆU (TAMPERED)
            </div>
          ) : isRejected ? (
            <div className="badge badge-danger" style={{ fontSize: "12px", padding: "6px 14px" }}>
              <XCircle size={15} />
              HỒ SƠ BỊ TỪ CHỐI PHÊ DUYỆT
            </div>
          ) : isDraftOrPreview ? (
            <div className="badge badge-warning" style={{ fontSize: "12px", padding: "6px 14px", background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b", border: "1px dashed rgba(245, 158, 11, 0.4)" }}>
              ⚠️ BẢN XEM TRƯỚC – CHƯA PHÁT HÀNH
            </div>
          ) : isPending ? (
            <div className="badge badge-warning" style={{ fontSize: "12px", padding: "6px 14px" }}>
              ⏳ ĐANG CHỜ PHÊ DUYỆT
            </div>
          ) : isValidActive ? (
            <div className="badge badge-success" style={{ fontSize: "12px", padding: "6px 14px" }}>
              <CheckCircle2 size={15} />
              HỢP LỆ &amp; CÒN HIỆU LỰC
            </div>
          ) : isRevoked ? (
            <div className="badge badge-danger" style={{ fontSize: "12px", padding: "6px 14px" }}>
              <XCircle size={15} />
              ĐÃ BỊ THU HỒI (REVOKED)
            </div>
          ) : isUnverified ? (
            <div className="badge badge-warning" style={{ fontSize: "12px", padding: "6px 14px" }}>
              ⚠️ CHƯA THỂ XÁC MINH TRÊN BLOCKCHAIN
            </div>
          ) : (
            <div className="badge badge-warning" style={{ fontSize: "12px", padding: "6px 14px" }}>
              <Calendar size={15} />
              HẾT HẠN HIỆU LỰC (EXPIRED)
            </div>
          )}

          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
            Mã bằng: <span style={{ color: "#f8fafc", fontWeight: 600 }}>{cert.certificate_code}</span>
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
            Ngày cấp: <span style={{ color: "#f8fafc" }}>{formatDate(cert.issue_date)}</span>
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
            boxShadow: "0 0 15px rgba(0,0,0,0.5)"
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
          <div style={{ fontSize: "10px", color: "#fbbf24", marginTop: "4px", fontWeight: 600 }}>
            {isIssued ? "QUÉT ĐỐI SOÁT XÁC THỰC" : "MÃ QR XEM TRƯỚC"}
          </div>
        </div>

      </div>

      {/* Verification details banner */}
      <div style={{
        marginTop: "16px",
        padding: "10px 14px",
        background: "rgba(0,0,0,0.4)",
        borderRadius: "8px",
        fontSize: "11px",
        display: "flex",
        justifyContent: "space-between",
        color: "#94a3b8"
      }}>
        <span>
          Mã số bằng:{" "}
          <strong style={{ color: isIssued && cert.token_id ? "#38bdf8" : "#94a3b8" }}>
            {isIssued && cert.token_id ? `#${cert.token_id}` : "Chưa phát hành"}
          </strong>
        </span>
        <span>
          Mã xác thực:{" "}
          <span style={{ color: isIssued && cert.tx_hash ? "#cbd5e1" : "#94a3b8" }}>
            {isIssued && cert.tx_hash ? shortenAddress(cert.tx_hash) : "Chưa phát sinh"}
          </span>
        </span>
        <span>
          Mã lưu trữ:{" "}
          <span style={{ color: isIssued && cert.ipfs_hash ? "#fbbf24" : "#94a3b8" }}>
            {isIssued && cert.ipfs_hash ? `${cert.ipfs_hash.slice(0, 8)}...` : "Chưa lưu trữ"}
          </span>
        </span>
      </div>

    </div>
  );
}
