import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Award,
  FilePlus,
  Users,
  ShieldCheck,
  Globe,
  Wallet,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  Layers
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { shortenAddress, connectMetaMask } from "../services/web3Service";

export default function AdminLayout({ children, wallet, setWallet, user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("certchain_user");
    navigate("/");
  };

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      const account = await connectMetaMask();
      setWallet(account);
    } catch (err) {
      alert("Lỗi kết nối ví: " + (err.message || err));
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
      label: "Cấp Chứng Chỉ Mới",
      icon: FilePlus,
      badge: user?.role === "ADMIN" ? "Đúc On-Chain" : "Soạn Nháp"
    },
    {
      path: "/admin/data-management",
      label: "Học Viên & Khóa Học",
      icon: Users,
      badge: null
    }
  ];

  // Breadcrumbs title determination
  const getBreadcrumb = () => {
    if (location.pathname === "/admin/dashboard") return "Tổng quan hệ thống";
    if (location.pathname === "/admin/certificates") return "Danh sách & Thu hồi chứng chỉ";
    if (location.pathname === "/admin/certificates/issue") return "Cấp chứng chỉ & Đúc Soulbound Token";
    if (location.pathname === "/admin/data-management") return "Quản trị học viên & khóa học";
    return "Phân hệ quản trị";
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
        style={{
          width: "280px",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 95,
          transition: "transform var(--transition-normal)",
          flexShrink: 0
        }}
      >
        {/* Brand Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              <div style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-0.5px" }}>
                CERT<span style={{ color: "var(--primary)" }}>CHAIN</span>
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Admin Workspace
              </div>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              display: "none",
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Role Card in Sidebar */}
        <div style={{
          padding: "16px 20px",
          margin: "16px 16px 8px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              TÀI KHOẢN ĐANG ĐĂNG NHẬP
            </div>
            <span className={`badge ${user?.role === "ADMIN" ? "badge-success" : "badge-warning"}`} style={{ fontSize: "10px", padding: "2px 8px" }}>
              {user?.role || "GUEST"}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "14px", marginTop: "4px", color: "var(--text-primary)" }}>
            {user?.full_name || "Quản trị viên"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            @{user?.username}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ padding: "12px 16px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "8px 12px 6px" }}>
            MODULE NGHIỆP VỤ
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--primary)" : "var(--text-secondary)",
                    background: active ? "var(--primary-bg)" : "transparent",
                    border: active ? "1px solid var(--border-subtle)" : "1px solid transparent",
                    transition: "all var(--transition-fast)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icon size={18} color={active ? "var(--primary)" : "var(--text-muted)"} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: user?.role === "ADMIN" ? "rgba(245, 158, 11, 0.15)" : "rgba(56, 189, 248, 0.15)",
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

          <div style={{ margin: "20px 0 10px", borderTop: "1px solid var(--border-subtle)" }} />

          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "8px 12px 6px" }}>
            LIÊN KẾT NGOÀI
          </div>

          <Link
            to="/verify"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 14px",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              color: "var(--text-secondary)"
            }}
          >
            <Globe size={16} />
            <span>Cổng Thẩm Định Công Khai</span>
          </Link>

          <Link
            to="/scanner"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 14px",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              color: "var(--text-secondary)"
            }}
          >
            <Layers size={16} />
            <span>Bộ Quét Mã QR</span>
          </Link>
        </nav>

        {/* Sidebar Footer - System & Network status */}
        <div style={{
          padding: "16px",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
          fontSize: "11px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "var(--text-muted)" }}>Smart Contract:</span>
            <span style={{ color: "var(--success-text)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--success-color)", display: "inline-block" }}></span>
              Sepolia / Hardhat
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Lưu trữ dữ liệu:</span>
            <span style={{ color: "var(--accent-gold)", fontWeight: 600 }}>IPFS Pinata Gateway</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* Top Header Workspace Bar */}
        <header
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
              className="btn btn-outline"
              style={{ display: "none", padding: "6px 10px" }}
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              <span style={{ color: "var(--text-muted)" }}>Hệ Thống</span>
              <ChevronRight size={14} color="var(--text-muted)" />
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{getBreadcrumb()}</span>
            </div>
          </div>

          {/* Action Tools: Theme, Wallet & User */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            
            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />

            {/* MetaMask Connector */}
            {wallet ? (
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
                className="btn btn-primary"
                style={{ fontSize: "12px", padding: "7px 14px" }}
              >
                <Wallet size={15} />
                {connecting ? "Đang kết nối..." : "Ví MetaMask"}
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="btn btn-outline"
              title="Đăng xuất khỏi hệ thống"
              style={{ padding: "8px 12px", fontSize: "12px", gap: "6px" }}
            >
              <LogOut size={14} />
              <span>Đăng Xuất</span>
            </button>

          </div>
        </header>

        {/* Content body */}
        <main style={{ flex: 1, padding: "28px 32px 60px" }}>
          {children}
        </main>

      </div>

    </div>
  );
}
