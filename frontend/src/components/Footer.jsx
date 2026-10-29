import React from "react";
import { ShieldCheck, Globe, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border-light)",
      background: "rgba(4, 7, 13, 0.95)",
      padding: "36px 0 28px",
      fontSize: "13px",
      color: "var(--text-muted)"
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

        <div style={{ textAlign: "center", paddingTop: "18px", borderTop: "1px solid rgba(255, 255, 255, 0.04)", fontSize: "12px" }}>
          Đề tài môn học: <strong>Blockchain & Ứng Dụng</strong> • 
          Phân hệ: <em>Frontend & Web3 UI (Nhánh <code>dev-tv3</code>)</em>
        </div>
      </div>
    </footer>
  );
}
