import React from "react";
import { useLocation } from "react-router-dom";
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
      padding: "24px 0",
      fontSize: "13px",
      color: "var(--text-muted)",
      transition: "background var(--transition-normal), border-color var(--transition-normal)"
    }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "28px",
            height: "28px",
            borderRadius: "7px",
            background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <ShieldCheck size={16} color="#04121e" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>
            CertChain English Testing Center
          </span>
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          © 2026 Hệ Thống Quản Lý &amp; Xác Thực Chứng Chỉ Tiếng Anh Điện Tử
        </div>
      </div>
    </footer>
  );
}
