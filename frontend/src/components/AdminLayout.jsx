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
import koheniLogoWhite from "../assets/koheni-logo-white.png";

export default function AdminLayout({ children, wallet, setWallet, user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const displayName = user?.full_name
    ? user.full_name.replace(/\s*\([^)]*\)/g, "")
    : (user?.role === "ADMIN" ? "Quản trị viên" : "Nhân viên Khảo thí");
  const roleName = user?.role === "ADMIN" ? "Quản trị viên" : "Nhân viên Khảo thí";
  const isAdmin = user?.role === "ADMIN";

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
      label: isAdmin ? "Duyệt & Cấp Bằng" : "Soạn Hồ Sơ Nháp",
      icon: FilePlus
    },
    {
      path: "/admin/data-management",
      label: isAdmin ? "Học Viên & Kỳ Thi" : "Quản Lý Học Viên",
      icon: Users
    }
  ];

  const getBreadcrumb = () => {
    if (location.pathname === "/admin/dashboard") return isAdmin ? "Tổng quan quản trị" : "Tổng quan khảo thí";
    if (location.pathname === "/admin/certificates") return isAdmin ? "Danh sách & Thu hồi chứng chỉ" : "Danh sách chứng chỉ";
    if (location.pathname === "/admin/certificates/issue") return isAdmin ? "Duyệt & Cấp phát chứng chỉ" : "Soạn hồ sơ nháp";
    if (location.pathname === "/admin/data-management") return isAdmin ? "Học viên & Danh mục kỳ thi" : "Quản lý học viên";
    return isAdmin ? "Quản trị hệ thống" : "Phân hệ khảo thí";
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

        {/* Airy Porcelain-White Sidebar (Auto-adapts to Obsidian Slate in Dark Mode) */}
        <aside className={`finnova-sidebar ${sidebarOpen ? "is-open" : ""}`}>
          {/* Top Brand Band (height: 68px — pixel-aligned with right topbar border) */}
          <div className="finnova-sidebar-header">
            <Link
              to="/admin/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="koheni-logo-wrap"
              style={{ textDecoration: "none" }}
            >
              <img
                src={koheniLogo}
                alt="Koheni — English Certificate & Management"
                className="koheni-logo-on-light"
                style={{ height: "38px", width: "auto", display: "block" }}
              />
              <img
                src={koheniLogoWhite}
                alt="Koheni — English Certificate & Management"
                className="koheni-logo-on-dark"
                style={{ height: "38px", width: "auto" }}
              />
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="finnova-sidebar-close"
              aria-label="Đóng menu"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Body */}
          <div style={{ padding: "20px 14px", display: "flex", flexDirection: "column", flex: 1, overflowY: "auto" }}>
            <div className="finnova-sidebar-section-label">
              {isAdmin ? "Quản trị hệ thống" : "Phân hệ khảo thí"}
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
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
                      <Icon size={17} strokeWidth={active ? 2.2 : 1.85} />
                      <span>{item.label}</span>
                    </span>
                    {active && <Sparkles size={13} />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Minimal Subtle System Footer */}
          <div className="finnova-sidebar-footer">
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 8px rgba(16, 185, 129, 0.55)",
                flexShrink: 0
              }}
            />
            <span>Koheni Certificate Portal</span>
          </div>
        </aside>

        {/* Right Workspace Column */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Balanced Top Workspace Header */}
          <header className="admin-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="finnova-icon-circle finnova-mobile-nav-btn"
                aria-label="Mở thanh bên"
              >
                <Menu size={18} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Hệ Thống</span>
                <ChevronRight size={14} color="var(--text-muted)" />
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{getBreadcrumb()}</span>
              </div>
            </div>

            {/* Right Controls: Wallet (Admin) + ThemeToggle + User & Logout Pill (Old Layout Rhythm) */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              {isAdmin && (
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
                      padding: "7px 14px",
                      fontSize: "12.5px",
                      background: "var(--bg-surface-elevated)"
                    }}
                  >
                    <Wallet size={14} />
                    {connecting ? "Đang kết nối..." : "Kết Nối Ví Ký"}
                  </button>
                )
              )}

              <ThemeToggle
                style={{
                  width: "36px",
                  height: "36px",
                  background: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-subtle)"
                }}
              />

              {user && (
                <>
                  <span style={{ width: "1px", height: "20px", background: "var(--border-subtle)" }} />

                  <div className="admin-user-pill">
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: isAdmin ? "rgba(2, 132, 199, 0.14)" : "rgba(245, 158, 11, 0.16)",
                        color: isAdmin ? "#0284c7" : "#d97706",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <User size={14} />
                    </div>

                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                      {displayName}
                    </span>

                    <span
                      className="admin-user-role-tag"
                      style={{
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: isAdmin ? "rgba(2, 132, 199, 0.12)" : "rgba(245, 158, 11, 0.14)",
                        color: isAdmin ? "#0284c7" : "#b45309",
                        border: isAdmin ? "1px solid rgba(2, 132, 199, 0.24)" : "1px solid rgba(245, 158, 11, 0.28)",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {roleName}
                    </span>

                    <span style={{ width: "1px", height: "16px", background: "var(--border-subtle)", marginLeft: "2px" }} />

                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Đăng xuất"
                      aria-label="Đăng xuất"
                      className="admin-logout-icon-btn"
                    >
                      <LogOut size={15} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Main Content Body */}
          <main style={{ flex: 1, padding: "24px 28px 40px" }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
