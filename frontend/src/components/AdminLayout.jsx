import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Award,
  FilePlus,
  Users,
  ShieldCheck,
  Wallet,
  LogOut,
  Menu,
  X,
  User,
  Sparkles
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { shortenAddress, connectMetaMask } from "../services/web3Service";
import { authApi } from "../services/apiService";
import { toast } from "./ToastContainer";

export default function AdminLayout({ children, wallet, setWallet, user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const displayName = user?.full_name
    ? user.full_name.replace(/\s*\([^)]*\)/g, "")
    : (user?.role === "ADMIN" ? "Quản trị viên" : "Nhân viên Khảo thí");
  const roleName = user?.role === "ADMIN" ? "Quản trị viên" : "Khảo thí";

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
      label: "Chứng Chỉ",
      icon: Award
    },
    {
      path: "/admin/certificates/issue",
      label: user?.role === "ADMIN" ? "Duyệt & Cấp Bằng" : "Soạn Nháp",
      icon: FilePlus
    },
    {
      path: "/admin/data-management",
      label: user?.role === "ADMIN" ? "Học Viên & Kỳ Thi" : "Học Viên",
      icon: Users
    }
  ];

  return (
    <div className="admin-shell-outer">
      <div className="admin-shell-frame">
        {/* Top Floating-Pill Navigation Bar (FINNOVA Style — No Left Sidebar) */}
        <header className="admin-topbar">
          {/* Left: Koheni Brand Emblem + Mobile Menu Trigger */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="finnova-icon-circle finnova-mobile-nav-btn"
              aria-label="Mở menu điều hướng"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <Link to="/admin/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <div style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #5b4df7 0%, #3b82f6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 18px -6px rgba(91, 77, 247, 0.55)"
              }}>
                <ShieldCheck size={20} color="#ffffff" strokeWidth={2.4} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "17px", letterSpacing: "-0.4px", color: "var(--text-primary)", lineHeight: 1.15 }}>
                  Koheni<span style={{ color: "#5b4df7" }}>.</span>
                </div>
                <div style={{ fontSize: "9.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  {user?.role === "ADMIN" ? "Quản Trị Hệ Thống" : "Phân Hệ Khảo Thí"}
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Signature Dark-Ink Floating Pill Nav */}
          <nav className="admin-floating-pill-nav" aria-label="Điều hướng quản trị">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`admin-pill-link ${active ? "is-active" : ""}`}
                >
                  {active && <Sparkles size={13} />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Circular Utilities + MetaMask Wallet + User Profile Pill */}
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
                  padding: "7px 13px",
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "9999px",
                  fontSize: "12px"
                }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px rgba(16, 185, 129, 0.7)" }} />
                  <span style={{ fontWeight: 700, color: "var(--success-text)" }}>{shortenAddress(wallet.address)}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={connecting}
                  className="btn btn-outline"
                  style={{
                    borderRadius: "9999px",
                    padding: "8px 14px",
                    fontSize: "12px",
                    background: "var(--bg-surface-elevated)"
                  }}
                >
                  <Wallet size={14} />
                  {connecting ? "Đang kết nối..." : "Ví Ký"}
                </button>
              )
            )}

            {user && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 6px 4px 5px",
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "9999px",
                boxShadow: "0 2px 10px rgba(21, 22, 38, 0.04)"
              }}>
                <div style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: user?.role === "ADMIN"
                    ? "linear-gradient(135deg, #5b4df7, #3b82f6)"
                    : "linear-gradient(135deg, #f59e0b, #ea580c)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "12px"
                }}>
                  {displayName ? displayName.charAt(0).toUpperCase() : <User size={14} />}
                </div>
                <div style={{ lineHeight: 1.2, paddingRight: "4px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-primary)" }}>{displayName}</div>
                  <div style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 600 }}>{roleName}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    border: "none",
                    background: "var(--bg-page)",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all var(--transition-fast)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ef4444";
                    e.currentTarget.style.background = "var(--danger-bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.background = "var(--bg-page)";
                  }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div style={{
            padding: "10px 16px 14px",
            background: "#151626",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px"
          }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`admin-pill-link ${active ? "is-active" : ""}`}
                  style={{ fontSize: "12.5px", padding: "8px 14px" }}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Main Content Canvas */}
        <main style={{ flex: 1, padding: "12px 26px 40px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
