import React from "react";
import { useLocation } from "react-router-dom";
import koheniLogo from "../assets/koheni-logo.png";

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
        <div className="koheni-logo-wrap">
          <img
            src={koheniLogo}
            alt="Koheni — English Certificate & Management"
            style={{ height: "32px", width: "auto", display: "block" }}
          />
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          © 2026 Koheni — Hệ Thống Tra Cứu &amp; Quản Lý Chứng Chỉ Tiếng Anh
        </div>
      </div>
    </footer>
  );
}
