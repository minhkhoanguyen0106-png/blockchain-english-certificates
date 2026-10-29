import React from "react";
import { ShieldCheck, Award, QrCode, ExternalLink, Calendar, Hash, CheckCircle2, XCircle } from "lucide-react";
import { shortenAddress } from "../services/web3Service";

export default function CertificateCard({ cert, isPreview = false }) {
  if (!cert) return null;

  const isValid = cert.status === "ISSUED_ON_CHAIN";
  const isRevoked = cert.status === "REVOKED";

  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(145deg, #0b1120 0%, #080d1a 100%)",
      border: "2px solid #b45309",
      borderRadius: "16px",
      padding: "36px 40px",
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(180, 83, 9, 0.08)",
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
        opacity: 0.03,
        pointerEvents: "none"
      }}>
        <Award size={400} color="#f59e0b" />
      </div>

      {/* Header of Certificate */}
      <div style={{ textAlign: "center", marginBottom: "24px", position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#f59e0b", marginBottom: "6px" }}>
          <Award size={24} />
          <span style={{ textTransform: "uppercase", letterSpacing: "3px", fontSize: "11px", fontWeight: 700 }}>
            International English Testing Center
          </span>
          <Award size={24} />
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
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Chứng Chỉ Khảo Thí Tiếng Anh Định Danh Trên Blockchain (Soulbound Token)
        </p>
      </div>

      {/* Recipient info */}
      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.5px" }}>
          Chứng nhận học viên (This is to certify that)
        </p>
        <h3 style={{
          fontFamily: "var(--font-serif)",
          fontSize: "30px",
          fontWeight: 700,
          color: "#38bdf8",
          margin: "8px 0"
        }}>
          {cert.student_name || "Họ Tên Học Viên"}
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Mã học viên: <strong style={{ color: "var(--text-primary)" }}>{cert.student_code || "HV-2026-XXXX"}</strong>
        </p>
      </div>

      {/* Course & Score highlight */}
      <div style={{
        background: "rgba(15, 23, 42, 0.7)",
        border: "1px solid rgba(245, 158, 11, 0.2)",
        borderRadius: "12px",
        padding: "16px 20px",
        margin: "20px 0",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>
          Đã hoàn thành xuất sắc kỳ thi:
        </div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "#fde68a", marginBottom: "12px" }}>
          {cert.course_name || "IELTS Academic Master"}
        </div>
        
        {/* Scores Table */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginTop: "12px" }}>
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
            <div style={{ fontSize: "11px", color: "var(--primary)" }}>OVERALL</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#38bdf8" }}>{cert.score || "7.5"}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Listening</div>
            <div style={{ fontSize: "15px", fontWeight: 700 }}>{cert.listening || "8.0"}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Reading</div>
            <div style={{ fontSize: "15px", fontWeight: 700 }}>{cert.reading || "7.5"}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Writing</div>
            <div style={{ fontSize: "15px", fontWeight: 700 }}>{cert.writing || "7.0"}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "8px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Speaking</div>
            <div style={{ fontSize: "15px", fontWeight: 700 }}>{cert.speaking || "7.5"}</div>
          </div>
        </div>
      </div>

      {/* Footer of Certificate: QR Code & Verification Proof */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid var(--border-light)" }}>
        
        {/* Verification Status Badge */}
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>TRẠNG THÁI ON-CHAIN</div>
          {isValid && (
            <div className="badge badge-success" style={{ fontSize: "12px", padding: "6px 14px" }}>
              <CheckCircle2 size={15} />
              HỢP LỆ VĨNH VIỄN (VERIFIED)
            </div>
          )}
          {isRevoked && (
            <div className="badge badge-danger" style={{ fontSize: "12px", padding: "6px 14px" }}>
              <XCircle size={15} />
              ĐÃ BỊ THU HỒI (REVOKED)
            </div>
          )}
          {cert.status === "PENDING" && (
            <div className="badge badge-warning" style={{ fontSize: "12px", padding: "6px 14px" }}>
              ĐANG CHỜ KÝ (PENDING DRAFT)
            </div>
          )}

          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
            Mã bằng: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{cert.certificate_code}</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Ngày cấp: <span style={{ color: "var(--text-primary)" }}>{cert.issue_date}</span>
          </div>
        </div>

        {/* QR Code representation */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            background: "#ffffff",
            padding: "8px",
            borderRadius: "10px",
            display: "inline-block",
            boxShadow: "0 0 15px rgba(0,0,0,0.5)"
          }}>
            <QrCode size={70} color="#000000" />
          </div>
          <div style={{ fontSize: "10px", color: "var(--accent-gold)", marginTop: "4px", fontWeight: 600 }}>
            QUÉT ĐỐI SOÁT ON-CHAIN
          </div>
        </div>

      </div>

      {/* Blockchain Details banner */}
      <div style={{
        marginTop: "16px",
        padding: "10px 14px",
        background: "rgba(0,0,0,0.4)",
        borderRadius: "8px",
        fontSize: "11px",
        display: "flex",
        justifyContent: "space-between",
        color: "var(--text-muted)"
      }}>
        <span>Token ID: <strong style={{ color: "#38bdf8" }}>#{cert.token_id || "1001"}</strong></span>
        <span>Tx Hash: <span style={{ color: "var(--text-secondary)" }}>{shortenAddress(cert.tx_hash)}</span></span>
        <span>IPFS: <span style={{ color: "var(--accent-gold)" }}>{cert.ipfs_hash ? `${cert.ipfs_hash.slice(0, 8)}...` : "QmPending"}</span></span>
      </div>

    </div>
  );
}
