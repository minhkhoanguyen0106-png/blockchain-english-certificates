import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Award,
  FilePlus,
  Users,
  Wallet,
  LogOut,
  Menu,
  X,
  User,
  Sparkles,
  ChevronRight
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { shortenAddress, connectMetaMask } from "../services/web3Service";
import { authApi } from "../services/apiService";
import { toast } from "./ToastContainer";
import koheniLogo from "../assets/koheni-logo.png";

export default function AdminLayout({ children, wallet, setWallet, user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const displayName = user?.full_name
    ? user.full_name.replace(/\s*\([^)]*\)/g, "")
    : (user?.role === "ADMIN" ? "Quản trị viên" : "Nhân viên Khảo thí");
  const roleName = user?.role === "ADMIN" ? "Quản trị viên" : "Nhân viên Khảo thí";

  const handleLogout = () => {
    setUser(null);
    authApi.logout();
    navigate("/");
  };

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      const account = await connectMetaMask();
      setWallet(account);
    } catch (err) {
      toast.error("Lỗi kết nối ví: " + (err.message || err));
    } finally {
      setConnecting(false);
    }
  };

  const navItems = [
    {
      path: "/admin/dashboard",
      label: "Tổng Quan",
      icon: LayoutDashboard
    },
    {
      path: "/admin/certificates",
      label: "Danh Sách Chứng Chỉ",
      icon: Award
    },
    {
      path: "/admin/certificates/issue",
      label: user?.role === "ADMIN" ? "Duyệt & Cấp Bằng" : "Soạn Hồ Sơ Nháp",
      icon: FilePlus
    },
    {
      path: "/admin/data-management",
      label: user?.role === "ADMIN" ? "Học Viên & Kỳ Thi" : "Quản Lý Học Viên",
      icon: Users
    }
  ];

  const getBreadcrumb = () => {
    if (location.pathname === "/admin/dashboard") return user?.role === "ADMIN" ? "Tổng quan quản trị" : "Tổng quan khảo thí";
    if (location.pathname === "/admin/certificates") return user?.role === "ADMIN" ? "Danh sách & Thu hồi chứng chỉ" : "Danh sách chứng chỉ";
    if (location.pathname === "/admin/certificates/issue") return user?.role === "ADMIN" ? "Duyệt & Cấp phát chứng chỉ" : "Soạn hồ sơ nháp";
    if (location.pathname === "/admin/data-management") return user?.role === "ADMIN" ? "Học viên & Danh mục kỳ thi" : "Quản lý học viên";
    return user?.role === "ADMIN" ? "Quản trị hệ thống" : "Phân hệ khảo thí";
  };

  return (
    <div className="admin-shell-outer">
      <div className="admin-shell-frame">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(9, 13, 22, 0.58)",
              backdropFilter: "blur(4px)",
              zIndex: 90
            }}
          />
        )}

        {/* Deep Midnight Sidebar (FINNOVA Style) */}
        <aside className={`finnova-sidebar ${sidebarOpen ? "is-open" : ""}`}>
          {/* Top Brand Logo Capsule */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "22px" }}>
            <Link
              to="/admin/dashboard"
              onClick={() => setSidebarOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                background: "#ffffff",
                padding: "10px 14px",
                borderRadius: "16px",
                boxShadow: "0 8px 20px -10px rgba(0, 0, 0, 0.45)",
                textDecoration: "none"
              }}
            >
              <img
                src={koheniLogo}
                alt="Koheni — English Certificate & Management"
                style={{ height: "34px", width: "auto", display: "block" }}
              />
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="finnova-sidebar-close"
              aria-label="Đóng menu"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "#cbd5e1",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              <X size={17} />
            </button>
          </div>

          {/* Section Label */}
          <div style={{
            fontSize: "10.5px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "rgba(159, 163, 184, 0.65)",
            padding: "0 12px 10px"
          }}>
            {user?.role === "ADMIN" ? "Quản trị hệ thống" : "Phân hệ khảo thí"}
          </div>

          {/* Vertical Pill Menu Items */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, overflowY: "auto" }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`finnova-sidebar-link ${active ? "is-active" : ""}`}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "11px" }}>
                    <Icon size={17} strokeWidth={active ? 2.3 : 1.9} />
                    <span>{item.label}</span>
                  </span>
                  {active && <Sparkles size={13} />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Docked Profile & Quick Logout Card */}
          {user && (
            <div style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: user?.role === "ADMIN"
                    ? "linear-gradient(135deg, #5b4df7, #3b82f6)"
                    : "linear-gradient(135deg, #f59e0b, #ea580c)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "13px",
                  flexShrink: 0
                }}>
                  {displayName ? displayName.charAt(0).toUpperCase() : <User size={14} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9fa3b8" }}>{roleName}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "#cbd5e1",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.16)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
                  e.currentTarget.style.color = "#fca5a5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.color = "#cbd5e1";
                }}
              >
                <LogOut size={13} /> Đăng xuất
              </button>
            </div>
          )}
        </aside>

        {/* Right Workspace Column */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Clean Top Workspace Header */}
          <header className="admin-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="finnova-icon-circle finnova-mobile-nav-btn"
                aria-label="Mở thanh bên"
              >
                <Menu size={18} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Koheni</span>
                <ChevronRight size={14} color="var(--text-muted)" />
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{getBreadcrumb()}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ThemeToggle
                style={{
                  width: "38px",
                  height: "38px",
                  background: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-subtle)"
                }}
              />

              {user?.role === "ADMIN" && (
                wallet ? (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "7px 14px",
                    background: "var(--bg-surface-elevated)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "9999px",
                    fontSize: "12px"
                  }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px rgba(16, 185, 129, 0.7)" }} />
                    <span style={{ fontWeight: 700, color: "var(--success-text)" }}>{shortenAddress(wallet.address)}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>({wallet.balance} ETH)</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectWallet}
                    disabled={connecting}
                    className="btn btn-outline"
                    style={{
                      borderRadius: "9999px",
                      padding: "8px 15px",
                      fontSize: "12.5px",
                      background: "var(--bg-surface-elevated)"
                    }}
                  >
                    <Wallet size={14} />
                    {connecting ? "Đang kết nối..." : "Kết Nối Ví Ký"}
                  </button>
                )
              )}
            </div>
          </header>

          {/* Main Content Body */}
          <main style={{ flex: 1, padding: "22px 26px 40px" }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
