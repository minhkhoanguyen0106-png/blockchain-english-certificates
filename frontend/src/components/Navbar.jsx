import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, QrCode, Search, LayoutDashboard, Wallet, LogOut, AlertCircle, Award } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { connectMetaMask, shortenAddress } from "../services/web3Service";

export default function Navbar({ wallet, setWallet, user, setUser }) {
  const location = useLocation();
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      setErrorMsg("");
      const account = await connectMetaMask();
      setWallet(account);
    } catch (err) {
      setErrorMsg(err.message || "Không thể kết nối MetaMask");
    } finally {
      setConnecting(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("certchain_user");
  };

  const isActive = (path) => location.pathname === path;

  // Don't render top public navbar if we are in admin workspace routes (/admin/*)
  if (location.pathname.startsWith("/admin")) {
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
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
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
            <div style={{ fontWeight: 800, fontSize: "17px", letterSpacing: "-0.5px", color: "var(--text-primary)", lineHeight: 1.2 }}>
              CERT<span style={{ color: "var(--primary)" }}>CHAIN</span>
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
              English Center SBT
            </div>
          </div>
        </Link>

        {/* Zone 2: Navigation Links (Clean typography, no bloated bubble cards) */}
        <nav style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          
          <Link
            to="/"
            style={{
              fontSize: "14px",
              fontWeight: isActive("/") ? 700 : 500,
              color: isActive("/") ? "var(--primary)" : "var(--text-secondary)",
              transition: "color var(--transition-fast)",
              position: "relative",
              padding: "6px 0"
            }}
          >
            Trang Chủ
            {isActive("/") && (
              <span style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "var(--primary)",
                borderRadius: "2px"
              }} />
            )}
          </Link>

          <Link
            to="/verify"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: isActive("/verify") ? 700 : 500,
              color: isActive("/verify") ? "var(--primary)" : "var(--text-secondary)",
              transition: "color var(--transition-fast)",
              position: "relative",
              padding: "6px 0"
            }}
          >
            <Search size={15} />
            Tra Cứu On-Chain
            {isActive("/verify") && (
              <span style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "var(--primary)",
                borderRadius: "2px"
              }} />
            )}
          </Link>

          <Link
            to="/scanner"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: isActive("/scanner") ? 700 : 500,
              color: isActive("/scanner") ? "var(--primary)" : "var(--text-secondary)",
              transition: "color var(--transition-fast)",
              position: "relative",
              padding: "6px 0"
            }}
          >
            <QrCode size={15} />
            Quét Mã QR
            {isActive("/scanner") && (
              <span style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "var(--primary)",
                borderRadius: "2px"
              }} />
            )}
          </Link>

          {/* Student Specific Link: Elegant text link */}
          {user && user.role === "STUDENT" && (
            <Link
              to="/verify?code=CERT-IELTS-2026-001"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                fontWeight: location.search.includes("CERT-IELTS") ? 700 : 600,
                color: "var(--accent-gold)",
                transition: "opacity var(--transition-fast)",
                padding: "6px 0"
              }}
            >
              <Award size={15} />
              Chứng Chỉ Của Tôi
            </Link>
          )}

          {/* Admin / Staff Quick Link */}
          {user && (user.role === "ADMIN" || user.role === "STAFF") && (
            <Link
              to="/admin/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--primary)",
                padding: "6px 0"
              }}
            >
              <LayoutDashboard size={15} />
              Vào Quản Trị
            </Link>
          )}

        </nav>

        {/* Zone 3: Unified Action Bar (Theme, Wallet, User Profile) */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          
          {/* Minimalist Theme Toggle (Circle icon button) */}
          <ThemeToggle />

          {/* Subtle Vertical Divider */}
          <div style={{ width: "1px", height: "20px", background: "var(--border-subtle)" }} />

          {/* MetaMask Status (Clean and proportional) */}
          {wallet ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "5px 12px",
              background: "var(--success-bg)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "var(--radius-full)",
              fontSize: "12px"
            }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--success-color)" }} />
              <span style={{ fontWeight: 600, color: "var(--success-text)" }}>{shortenAddress(wallet.address)}</span>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              disabled={connecting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 13px",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                fontWeight: 600,
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all var(--transition-fast)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.color = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              title="Kết nối ví Web3 để ký giao dịch"
            >
              <Wallet size={15} />
              <span>{connecting ? "Đang kết nối..." : "Ví MetaMask"}</span>
            </button>
          )}

          {/* User Profile Capsule (Unified avatar, username, role and logout) */}
          {user ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 6px 4px 10px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-full)",
              fontSize: "12px"
            }}>
              {/* Avatar circle with first letter */}
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: user.role === "ADMIN" ? "linear-gradient(135deg, #0284c7, #38bdf8)" : user.role === "STAFF" ? "linear-gradient(135deg, #d97706, #f59e0b)" : "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "11px"
              }}>
                {user.username ? user.username.charAt(0).toUpperCase() : "U"}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{user.username}</span>
                <span style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background: user.role === "ADMIN" ? "rgba(16, 185, 129, 0.15)" : user.role === "STAFF" ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 102, 241, 0.15)",
                  color: user.role === "ADMIN" ? "var(--success-text)" : user.role === "STAFF" ? "var(--warning-text)" : "var(--primary)"
                }}>
                  {user.role}
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
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              Đăng Nhập
            </Link>
          )}

        </div>

      </div>

      {errorMsg && (
        <div style={{
          background: "var(--danger-bg)",
          color: "var(--danger-text)",
          padding: "6px 20px",
          textAlign: "center",
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}>
          <AlertCircle size={14} />
          {errorMsg}
        </div>
      )}
    </header>
  );
}
