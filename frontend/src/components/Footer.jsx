import React from "react";
import { useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  const location = useLocation();

  // Hide global footer in admin workspace and immersive login screen
  if (location.pathname.startsWith("/admin") || location.pathname === "/login") {
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
            borderRadius: "8px",
            background: "#14364d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <ShieldCheck size={15} color="#5cc4d8" strokeWidth={2.4} />
          </div>
          <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>
            Koheni English Testing Center
          </span>
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          © 2026 Koheni — Hệ Thống Tra Cứu &amp; Quản Lý Chứng Chỉ Tiếng Anh
        </div>
      </div>
    </footer>
  );
}
