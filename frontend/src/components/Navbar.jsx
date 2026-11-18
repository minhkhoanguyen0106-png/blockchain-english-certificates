import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, LayoutDashboard, LogOut, Lock } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { authApi } from "../services/apiService";

export default function Navbar({ user, setUser }) {
  const location = useLocation();

  const handleLogout = () => {
    setUser(null);
    authApi.logout();
  };

  const displayName = user?.full_name
    ? user.full_name.replace(/\s*\([^)]*\)/g, "")
    : (user?.username || "");
  const roleName = user?.role === "ADMIN" ? "Quản trị viên" : user?.role === "STAFF" ? "Khảo thí" : "Học viên";

  const isActive = (path) => location.pathname === path;

  // Don't render top public navbar in admin workspace or immersive login screen
  if (location.pathname.startsWith("/admin") || location.pathname === "/login") {
    return null;
  }

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "var(--bg-header)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border-subtle)",
      transition: "background var(--transition-normal), border-color var(--transition-normal)"
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "68px" }}>
        
        {/* Zone 1: Brand Logo */}
        <Link to="/" className="nav-drop-item" style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, "--drop-delay": "0.04s" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px var(--primary-glow)"
          }}>
            <ShieldCheck size={22} color="#04121e" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.5px", color: "var(--text-primary)", lineHeight: 1.15 }}>
              Koheni<span style={{ color: "var(--primary)" }}>.</span>
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
              English Testing Center
            </div>
          </div>
        </Link>

        {/* Zone 2: Unified Action Bar (Theme, Admin Entry, User Profile) */}
        <div className="nav-drop-item" style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, "--drop-delay": "0.14s" }}>
          
          {/* Admin / Staff Workspace Button */}
          {user && (user.role === "ADMIN" || user.role === "STAFF") && (
            <Link
              to="/admin/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                fontWeight: 600,
                background: "rgba(2, 132, 199, 0.08)",
                border: "1px solid rgba(2, 132, 199, 0.25)",
                color: "var(--primary)",
                textDecoration: "none",
                transition: "all var(--transition-fast)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--primary)";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(2, 132, 199, 0.08)";
                e.currentTarget.style.color = "var(--primary)";
                e.currentTarget.style.borderColor = "rgba(2, 132, 199, 0.25)";
              }}
            >
              <LayoutDashboard size={15} />
              <span>Trang Quản Trị</span>
            </Link>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile Capsule (Unified avatar, full name, role and logout) */}
          {user ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 8px 4px 6px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-full)",
              fontSize: "12px"
            }}>
              {/* Avatar circle with first letter */}
              <div style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: user.role === "ADMIN" 
                  ? "linear-gradient(135deg, #0284c7, #38bdf8)" 
                  : user.role === "STAFF" 
                  ? "linear-gradient(135deg, #d97706, #f59e0b)" 
                  : "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "12px",
                flexShrink: 0
              }}>
                {displayName ? displayName.charAt(0).toUpperCase() : "U"}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </span>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "var(--radius-full)",
                  background: user.role === "ADMIN" ? "rgba(16, 185, 129, 0.15)" : user.role === "STAFF" ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 102, 241, 0.15)",
                  color: user.role === "ADMIN" ? "var(--success-text)" : user.role === "STAFF" ? "var(--warning-text)" : "var(--primary)"
                }}>
                  {roleName}
                </span>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px 6px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color var(--transition-fast)"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger-text)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                title="Đăng xuất"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : !isActive("/login") ? (
            <Link
              to="/login"
              className="btn btn-outline"
              style={{ padding: "7px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              title="Dành cho Quản trị viên và Cán bộ Khảo thí"
            >
              <Lock size={13} />
              Cổng Nội Bộ
            </Link>
          ) : null}

        </div>

      </div>
    </header>
  );
}
