import React from "react";
import { useLocation } from "react-router-dom";
import { ShieldCheck, Globe, ExternalLink } from "lucide-react";

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
      padding: "36px 0 28px",
      fontSize: "13px",
      color: "var(--text-muted)",
      transition: "background var(--transition-normal), border-color var(--transition-normal)"
    }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", marginBottom: "20px" }}>
          
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
              CertChain English Center
            </span>
          </div>

          <div style={{ display: "flex", gap: "16px", fontSize: "13px" }}>
            <a
              href="https://github.com/minhkhoanguyen0106-png/blockchain-english-certificates"
              target="_blank"
              rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}
            >
              <Globe size={15} /> GitHub Repository <ExternalLink size={12} />
            </a>
          </div>

        </div>

        <div style={{ textAlign: "center", paddingTop: "18px", borderTop: "1px solid var(--border-subtle)", fontSize: "12px", color: "var(--text-muted)" }}>
          Đề tài môn học: <strong>Blockchain & Ứng Dụng</strong> • 
          Hệ Thống Quản Lý & Xác Thực Bằng Tiếng Anh Bằng SBT (Soulbound Token)
        </div>
      </div>
    </footer>
  );
}
