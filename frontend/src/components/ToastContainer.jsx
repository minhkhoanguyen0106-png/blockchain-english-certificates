import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

const listeners = new Set();
let nextId = 1;

function emitToast(type, message, duration = 4200) {
  const id = nextId++;
  const item = { id, type, message, duration };
  listeners.forEach((fn) => fn(item));
}

export const toast = {
  success: (msg, duration) => emitToast("success", msg, duration),
  error: (msg, duration) => emitToast("error", msg, duration ?? 5500),
  warning: (msg, duration) => emitToast("warning", msg, duration),
  info: (msg, duration) => emitToast("info", msg, duration)
};

function cleanToastMessage(msg) {
  if (!msg) return "";
  let str = String(msg);
  // Bắt lỗi AccessControlUnauthorizedAccount (0xe2517d3f) từ Smart Contract
  if (str.includes("0xe2517d3f") || str.includes("AccessControlUnauthorizedAccount")) {
    return "Lỗi phân quyền Blockchain: Ví MetaMask của bạn chưa được cấp quyền ISSUER_ROLE để phát hành chứng chỉ. Vui lòng chuyển sang ví Admin gốc (0xf82b...Dcc6) trên MetaMask để ký!";
  }
  // Loại bỏ các đoạn mã hex nhị phân dài ngoằng làm tràn màn hình
  if (str.includes('data="0x') || str.includes('transaction=')) {
    str = str.replace(/data="0x[a-fA-F0-9]{20,}"/g, 'data="[mã hex nhị phân]"');
    str = str.replace(/transaction=\{[\s\S]*?\}/g, "");
    str = str.replace(/\(action="estimateGas"[\s\S]*?\)/g, "");
  }
  if (str.length > 220) {
    str = str.slice(0, 220) + "...";
  }
  return str.trim();
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNew = (item) => {
      setToasts((prev) => [...prev.slice(-4), item]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, item.duration);
    };
    listeners.add(handleNew);
    return () => listeners.delete(handleNew);
  }, []);

  if (toasts.length === 0) return null;

  const palette = {
    success: { bg: "var(--bg-surface-elevated)", border: "rgba(16, 185, 129, 0.45)", iconColor: "var(--success-color)", Icon: CheckCircle2 },
    error: { bg: "var(--bg-surface-elevated)", border: "rgba(239, 68, 68, 0.5)", iconColor: "var(--danger-color)", Icon: XCircle },
    warning: { bg: "var(--bg-surface-elevated)", border: "rgba(245, 158, 11, 0.5)", iconColor: "var(--warning-color)", Icon: AlertTriangle },
    info: { bg: "var(--bg-surface-elevated)", border: "rgba(56, 189, 248, 0.45)", iconColor: "var(--primary)", Icon: Info }
  };

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      maxWidth: "400px",
      width: "calc(100vw - 40px)",
      pointerEvents: "none"
    }}>
      {toasts.map((t) => {
        const cfg = palette[t.type] || palette.info;
        const Icon = cfg.Icon;
        return (
          <div
            key={t.id}
            role="status"
            style={{
              pointerEvents: "auto",
              background: cfg.bg,
              backdropFilter: "blur(16px)",
              border: `1px solid ${cfg.border}`,
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              boxShadow: "var(--shadow-dropdown)",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              color: "var(--text-primary)",
              fontSize: "13px",
              lineHeight: 1.45
            }}
          >
            <Icon size={18} color={cfg.iconColor} style={{ flexShrink: 0, marginTop: "1px" }} />
            <div style={{ flex: 1, whiteSpace: "pre-line", wordBreak: "break-word", maxHeight: "160px", overflowY: "auto", paddingRight: "4px" }}>
              {cleanToastMessage(t.message)}
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "2px",
                display: "flex"
              }}
              aria-label="Đóng thông báo"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
