import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  const location = useLocation();

  // Hide global footer in admin workspace to maximize data table screen height
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer style={{
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--bg-surface)",
      padding: "32px 0 24px",
      fontSize: "13px",
      color: "var(--text-muted)",
      transition: "background var(--transition-normal), border-color var(--transition-normal)"
    }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", marginBottom: "18px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <ShieldCheck size={18} color="#04121e" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "15px" }}>
              CertChain English Testing Center
            </span>
          </div>

          <div style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
            <Link to="/verify" style={{ color: "var(--text-secondary)" }}>Tra Cứu Bằng Cấp</Link>
            <Link to="/scanner" style={{ color: "var(--text-secondary)" }}>Quét Mã QR</Link>
            <Link to="/login" style={{ color: "var(--text-secondary)" }}>Cổng Nội Bộ</Link>
          </div>

        </div>

        <div style={{ textAlign: "center", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)", fontSize: "12px", color: "var(--text-muted)" }}>
          © 2026 <strong>CertChain English Testing Center</strong> • Hệ Thống Quản Lý &amp; Xác Thực Chứng Chỉ Tiếng Anh Điện Tử
        </div>
      </div>
    </footer>
  );
}
