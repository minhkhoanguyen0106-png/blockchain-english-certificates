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
  ChevronRight,
  Menu,
  X,
  User
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { shortenAddress, connectMetaMask } from "../services/web3Service";
import { authApi } from "../services/apiService";
import { toast } from "./ToastContainer";

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
      label: "Tổng Quan (Dashboard)",
      icon: LayoutDashboard,
      badge: null
    },
    {
      path: "/admin/certificates",
      label: "Danh Sách Chứng Chỉ",
      icon: Award,
      badge: null
    },
    {
      path: "/admin/certificates/issue",
      label: user?.role === "ADMIN" ? "Duyệt & Cấp Chứng Chỉ" : "Soạn Hồ Sơ Nháp",
      icon: FilePlus,
      badge: null
    },
    {
      path: "/admin/data-management",
      label: user?.role === "ADMIN" ? "Học Viên & Kỳ Thi" : "Quản Lý Học Viên",
      icon: Users,
      badge: null
    }
  ];

  // Breadcrumbs title determination
  const getBreadcrumb = () => {
    if (location.pathname === "/admin/dashboard") return user?.role === "ADMIN" ? "Tổng quan quản trị" : "Tổng quan khảo thí";
    if (location.pathname === "/admin/certificates") return user?.role === "ADMIN" ? "Danh sách & Thu hồi chứng chỉ" : "Danh sách chứng chỉ";
    if (location.pathname === "/admin/certificates/issue") return user?.role === "ADMIN" ? "Duyệt & Cấp phát chứng chỉ số" : "Soạn hồ sơ nháp chứng chỉ";
    if (location.pathname === "/admin/data-management") return user?.role === "ADMIN" ? "Quản trị học viên & danh mục kỳ thi" : "Quản lý danh sách học viên";
    return user?.role === "ADMIN" ? "Phân hệ quản trị" : "Phân hệ khảo thí";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-page)" }}>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 90,
            backdropFilter: "blur(4px)"
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : ""}`}
      >
        {/* Brand Header (Khớp tuyệt đối chiều cao 64px với Top Header Bar) */}
        <div style={{
          height: "64px",
          padding: "0 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0
        }}>
          <Link to="/admin/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#14364d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px -2px rgba(20, 54, 77, 0.25)"
            }}>
              <ShieldCheck size={20} color="#5cc4d8" strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
                Koheni<span style={{ color: "var(--primary)" }}>.</span>
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                {user?.role === "ADMIN" ? "Quản Trị Hệ Thống" : "Phân Hệ Khảo Thí"}
              </div>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="admin-sidebar-close-btn"
            aria-label="Đóng thanh bên"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{ padding: "16px 14px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.9px", padding: "6px 12px 10px" }}>
            Điều hướng
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`admin-nav-link ${active ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--primary)" : "var(--text-secondary)",
                    background: active ? "var(--primary-bg)" : "transparent",
                    transition: "background var(--transition-fast), color var(--transition-fast)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icon size={17} strokeWidth={active ? 2.3 : 1.9} color={active ? "var(--primary)" : "var(--text-muted)"} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "9999px",
                        background: user?.role === "ADMIN" ? "var(--accent-gold-bg)" : "var(--primary-bg)",
                        color: user?.role === "ADMIN" ? "var(--accent-gold)" : "var(--primary)"
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Minimal Institutional Sidebar Footer */}
        <div style={{
          padding: "14px 18px",
          borderTop: "1px solid var(--border-subtle)",
          fontSize: "11px",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <span style={{ fontWeight: 600 }}>Koheni Portal</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--success-text)", fontWeight: 600 }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--success-color)" }} />
            Sẵn sàng
          </span>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* Top Header Workspace Bar */}
        <header
          className="admin-topbar"
          style={{
            height: "64px",
            background: "var(--bg-header)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            position: "sticky",
            top: 0,
            zIndex: 80
          }}
        >
          {/* Breadcrumb & mobile menu */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn btn-outline admin-mobile-menu-btn"
              aria-label="Mở thanh điều hướng"
            >
              <Menu size={18} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              <span style={{ color: "var(--text-muted)" }}>Hệ Thống</span>
              <ChevronRight size={14} color="var(--text-muted)" />
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{getBreadcrumb()}</span>
            </div>
          </div>

          {/* Action Tools: Theme, Wallet (Admin only) & Unified User Capsule */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />

            {/* MetaMask Connector (Chỉ hiển thị cho ADMIN ký duyệt on-chain) */}
            {user?.role === "ADMIN" && (
              wallet ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  background: "var(--success-bg)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "12px"
                }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success-color)", boxShadow: "0 0 6px var(--success-color)" }} />
                  <span style={{ fontWeight: 600, color: "var(--success-text)" }}>{shortenAddress(wallet.address)}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>({wallet.balance} ETH)</span>
                </div>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  disabled={connecting}
                  className="btn btn-outline"
                  style={{ fontSize: "12px", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Wallet size={15} />
                  {connecting ? "Đang kết nối..." : "Kết Nối Ví Ký"}
                </button>
              )
            )}

            <div style={{ width: "1px", height: "20px", background: "var(--border-subtle)" }} />

            {/* Unified User Profile Capsule + Logout */}
            {user && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 6px 4px 8px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-full)",
                fontSize: "12px"
              }}>
                <div style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: user?.role === "ADMIN" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: user?.role === "ADMIN" ? "var(--success-color)" : "var(--warning-color)",
                  fontWeight: 700,
                  fontSize: "11px"
                }}>
                  <User size={13} />
                </div>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{displayName}</span>
                <span className={`badge ${user?.role === "ADMIN" ? "badge-success" : "badge-warning"}`} style={{ fontSize: "10px", padding: "2px 7px" }}>
                  {roleName}
                </span>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất khỏi hệ thống"
                  style={{
                    background: "transparent",
                    border: "none",
                    borderLeft: "1px solid var(--border-subtle)",
                    padding: "4px 6px 4px 8px",
                    marginLeft: "2px",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "color var(--transition-fast)"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger-text)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}

          </div>
        </header>

        {/* Content body */}
        <main className="admin-content" style={{ flex: 1 }}>
          {children}
        </main>

      </div>

    </div>
  );
}
