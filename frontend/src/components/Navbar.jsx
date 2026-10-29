import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, QrCode, Search, LayoutDashboard, Wallet, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { connectMetaMask, isMetaMaskInstalled, shortenAddress } from "../services/web3Service";

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

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(7, 10, 18, 0.8)",
      backdropFilter: "blur(18px)",
      borderBottom: "1px solid var(--border-light)"
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "72px" }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px var(--primary-glow)"
          }}>
            <ShieldCheck size={24} color="#04121e" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.5px" }}>
              CERT<span style={{ color: "var(--primary)" }}>CHAIN</span>
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
              English Center SBT
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Link to="/" className={`btn btn-outline ${isActive("/") ? "active" : ""}`} style={{
            border: "none",
            color: isActive("/") ? "var(--primary)" : "var(--text-secondary)",
            background: isActive("/") ? "rgba(56, 189, 248, 0.1)" : "transparent"
          }}>
            Trang Chủ
          </Link>

          <Link to="/verify" className="btn btn-outline" style={{
            border: "none",
            color: isActive("/verify") ? "var(--primary)" : "var(--text-secondary)",
            background: isActive("/verify") ? "rgba(56, 189, 248, 0.1)" : "transparent"
          }}>
            <Search size={16} />
            Tra Cứu On-Chain
          </Link>

          <Link to="/scanner" className="btn btn-outline" style={{
            border: "none",
            color: isActive("/scanner") ? "var(--primary)" : "var(--text-secondary)",
            background: isActive("/scanner") ? "rgba(56, 189, 248, 0.1)" : "transparent"
          }}>
            <QrCode size={16} />
            Quét Mã QR
          </Link>

          {user && (user.role === "ADMIN" || user.role === "STAFF") && (
            <Link to="/admin/dashboard" className="btn btn-outline" style={{
              border: "none",
              color: location.pathname.startsWith("/admin") ? "var(--primary)" : "var(--text-secondary)",
              background: location.pathname.startsWith("/admin") ? "rgba(56, 189, 248, 0.1)" : "transparent"
            }}>
              <LayoutDashboard size={16} />
              Quản Trị
            </Link>
          )}

          {user && user.role === "STUDENT" && (
            <Link to="/verify?code=CERT-IELTS-2026-001" className="btn btn-outline" style={{
              border: "none",
              color: "var(--accent-gold)",
              background: "rgba(245, 158, 11, 0.1)"
            }}>
              Chứng Chỉ Của Tôi
            </Link>
          )}
        </nav>

        {/* Web3 Wallet & User Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          
          {/* MetaMask Connector */}
          {wallet ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "var(--radius-full)",
              fontSize: "13px"
            }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
              <span style={{ fontWeight: 600, color: "#34d399" }}>{shortenAddress(wallet.address)}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>({wallet.balance} ETH)</span>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              disabled={connecting}
              className="btn btn-primary"
              style={{ fontSize: "13px", padding: "8px 16px" }}
            >
              <Wallet size={16} />
              {connecting ? "Đang kết nối..." : "Kết Nối MetaMask"}
            </button>
          )}

          {/* User Profile Pill & Logout */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                fontSize: "12px"
              }}>
                <span style={{ fontWeight: 600 }}>{user.username}</span>
                <span className={`badge ${user.role === "ADMIN" ? "badge-success" : user.role === "STAFF" ? "badge-warning" : "badge-info"}`} style={{ fontSize: "10px", padding: "2px 8px" }}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                title="Đăng xuất"
                style={{ padding: "8px 10px" }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-outline" style={{ fontSize: "13px", padding: "8px 14px" }}>
              Đăng Nhập
            </Link>
          )}

        </div>

      </div>

      {errorMsg && (
        <div style={{
          background: "var(--danger-bg)",
          color: "#f87171",
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
