import React from "react";
import { Navigate, Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

export default function ProtectedRoute({ user, allowedRoles, children }) {
  // 1. Chưa đăng nhập -> Chuyển hướng sang trang đăng nhập
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Đã đăng nhập nhưng không đủ quyền
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ minHeight: "75vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div className="glass-panel" style={{
          maxWidth: "520px",
          width: "100%",
          padding: "40px 32px",
          textAlign: "center",
          borderColor: "rgba(239, 68, 68, 0.4)",
          background: "var(--bg-surface-elevated)"
        }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "var(--danger-bg)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px"
          }}>
            <ShieldAlert size={32} color="var(--danger-text)" />
          </div>

          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--danger-text)", marginBottom: "8px" }}>
            403 - Quyền Truy Cập Bị Từ Chối
          </h2>

          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
            Tài khoản hiện tại của bạn là <strong>{user.full_name}</strong> với vai trò:{" "}
            <span className="badge badge-warning">{user.role}</span>.<br />
            Bạn không có thẩm quyền truy cập vào phân hệ này. Chỉ tài khoản có vai trò{" "}
            <strong>{allowedRoles.join(" hoặc ")}</strong> mới được cấp quyền.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link to="/" className="btn btn-outline">
              <ArrowLeft size={16} /> Về Trang Chủ
            </Link>
            <Link to="/login" className="btn btn-primary">
              <LogIn size={16} /> Đổi Tài Khoản Khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Đầy đủ quyền hạn
  return children;
}
