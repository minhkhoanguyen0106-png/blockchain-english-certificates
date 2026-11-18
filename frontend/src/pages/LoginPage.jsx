import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, User, ArrowLeft, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
import { authApi } from "../services/apiService";
import loginIllustration from "../assets/login-illustration.jpg";

export default function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await authApi.login(username, password);
      if (!result?.user?.role) throw new Error("Máy chủ không trả về thông tin tài khoản hợp lệ.");

      const userData = {
        id: result.user.id,
        username: result.user.username,
        full_name: result.user.fullName || result.user.full_name,
        email: result.user.email,
        role: result.user.role
      };
      setUser(userData);
      localStorage.setItem("certchain_user", JSON.stringify(userData));

      if (["ADMIN", "STAFF"].includes(userData.role)) {
        navigate("/admin/dashboard");
      } else {
        authApi.logout();
        setUser(null);
        setErrorMessage("Cổng đăng nhập chỉ dành cho Quản trị viên và Cán bộ Khảo thí. Học viên vui lòng tra cứu trực tiếp tại Trang Chủ.");
      }
    } catch (err) {
      authApi.logout();
      setUser(null);
      setErrorMessage(err.message || "Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "28px 20px",
      position: "relative",
      overflow: "hidden",
      background: "radial-gradient(circle at 18% 20%, #1a4763 0%, #102e44 48%, #091d2d 100%)"
    }}>
      {/* Ambient Bokeh Orbs in Outer Backdrop (matching reference atmosphere) */}
      <div style={{ position: "absolute", top: "8%", left: "12%", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(92, 196, 216, 0.08)", filter: "blur(2px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(56, 189, 248, 0.07)", filter: "blur(3px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "68%", left: "6%", width: "90px", height: "90px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.04)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "14%", right: "22%", width: "64px", height: "64px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)", pointerEvents: "none" }} />

      {/* Main Rounded Split-Wave Card */}
      <div className="login-split-card login-card-enter">

        {/* LEFT PANEL: Seamless Organic White S-Wave over Deep Slate Card */}
        <div
          className="login-illustration-panel"
          style={{
            position: "relative",
            background: "transparent",
            padding: "32px 36px 26px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          {/* Full-panel White Organic Wave Shape (zero subpixel seam at any DPI/zoom) */}
          <svg
            viewBox="0 0 540 600"
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              pointerEvents: "none",
              zIndex: 0
            }}
          >
            <path
              d="M-5,-5 L445,-5 C418,115 525,215 528,350 C530,455 488,535 442,605 L-5,605 Z"
              fill="#ffffff"
            />
          </svg>

          {/* Top-Left Brand Crest */}
          <Link to="/" className="nav-drop-item" style={{ display: "inline-flex", alignItems: "center", gap: "11px", textDecoration: "none", position: "relative", zIndex: 2, width: "fit-content", "--drop-delay": "0.12s" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "11px",
              background: "linear-gradient(135deg, #0284c7 0%, #143d59 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 14px rgba(2, 132, 199, 0.25)"
            }}>
              <ShieldCheck size={22} color="#ffffff" strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.5px", color: "#0f2c42", lineHeight: 1.15 }}>
                Koheni<span style={{ color: "#0284c7" }}>.</span>
              </div>
              <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>
                English Testing Center
              </div>
            </div>
          </Link>

          {/* Center Bespoke Certificate + English + Blockchain Illustration (Spring Focal Pop + Gentle Float) */}
          <div style={{ position: "relative", paddingRight: "48px", margin: "4px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="spring-focal-pop" style={{ width: "100%", maxWidth: "380px", "--pop-delay": "0.22s" }}>
              <img
                src={loginIllustration}
                alt="Minh họa hệ thống chứng chỉ tiếng Anh xác thực Blockchain"
                className="login-float-slow"
                draggable={false}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  mixBlendMode: "multiply",
                  userSelect: "none"
                }}
              />
            </div>
          </div>

          {/* Bottom-Left Subtle Institutional Attribution */}
          <div style={{ position: "relative", zIndex: 2, fontSize: "10.5px", color: "#94a3b8", lineHeight: 1.5 }}>
            <div>© 2026 Koheni English Testing Center</div>
            <div style={{ fontWeight: 600, color: "#64748b" }}>Powered by Blockchain Verification</div>
          </div>
        </div>

        {/* RIGHT PANEL: Rich Deep Ocean-Slate Login Form */}
        <div style={{
          position: "relative",
          background: "#14364d",
          padding: "32px 44px 36px 36px",
          display: "flex",
          flexDirection: "column",
          zIndex: 2
        }}>
          {/* Top-right Back to Home link + Mobile-only Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link
              to="/"
              className="login-mobile-brand"
              style={{ display: "none", alignItems: "center", gap: "8px", textDecoration: "none" }}
            >
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #38bdf8, #0284c7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <ShieldCheck size={18} color="#ffffff" />
              </div>
              <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "17px", letterSpacing: "-0.4px" }}>Koheni<span style={{ color: "#38bdf8" }}>.</span></span>
            </Link>

            <Link
              to="/"
              className="nav-drop-item"
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                color: "rgba(186, 214, 230, 0.72)",
                fontSize: "12.5px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color var(--transition-fast)",
                "--drop-delay": "0.18s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(186, 214, 230, 0.72)"; }}
            >
              <ArrowLeft size={14} /> Về trang chủ
            </Link>
          </div>

          {/* Centered Form Block */}
          <div style={{ width: "100%", maxWidth: "320px", margin: "auto", padding: "24px 0" }}>
            <div style={{ overflow: "hidden" }}>
              <h2 className="mask-slide-left" style={{ fontSize: "30px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", marginBottom: "6px", "--slide-delay": "0.26s" }}>
                Đăng Nhập
              </h2>
            </div>
            <p className="login-field-enter" style={{ fontSize: "13px", color: "rgba(186, 214, 230, 0.72)", marginBottom: "26px", "--field-delay": "0.38s" }}>
              Cổng nội bộ Quản trị viên &amp; Cán bộ Khảo thí
            </p>

            <form onSubmit={handleSubmit}>
              <div className="login-field-enter" style={{ marginBottom: "16px", "--field-delay": "0.46s" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#e2f1f8", marginBottom: "7px", paddingLeft: "4px" }}>
                  Tên đăng nhập
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="login-pill-input"
                  />
                  <User size={15} color="rgba(148, 197, 224, 0.65)" style={{ position: "absolute", left: "15px", top: "14px" }} />
                </div>
              </div>

              <div className="login-field-enter" style={{ marginBottom: "20px", "--field-delay": "0.54s" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#e2f1f8", marginBottom: "7px", paddingLeft: "4px" }}>
                  Mật khẩu
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-pill-input"
                    style={{ paddingRight: "42px" }}
                  />
                  <Lock size={15} color="rgba(148, 197, 224, 0.65)" style={{ position: "absolute", left: "15px", top: "14px" }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "13px",
                      top: "12px",
                      background: "transparent",
                      border: "none",
                      color: "rgba(148, 197, 224, 0.65)",
                      cursor: "pointer",
                      padding: "2px",
                      display: "flex"
                    }}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  style={{
                    background: "rgba(239, 68, 68, 0.16)",
                    border: "1px solid rgba(248, 113, 113, 0.4)",
                    color: "#fecaca",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    marginBottom: "16px",
                    fontSize: "12.5px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    lineHeight: 1.45
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="login-field-enter" style={{ "--field-delay": "0.62s" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "44px",
                    borderRadius: "9999px",
                    border: "none",
                    background: "linear-gradient(135deg, #5cc4d8 0%, #38a8c7 100%)",
                    color: "#ffffff",
                    fontSize: "14.5px",
                    fontWeight: 700,
                    letterSpacing: "0.2px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.65 : 1,
                    boxShadow: "0 10px 24px -6px rgba(56, 168, 199, 0.55)",
                    transition: "transform var(--transition-fast), box-shadow var(--transition-fast)"
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 14px 28px -6px rgba(56, 168, 199, 0.7)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 10px 24px -6px rgba(56, 168, 199, 0.55)";
                  }}
                >
                  {loading ? "Đang xác thực..." : "Đăng Nhập Hệ Thống"}
                </button>
              </div>

              <div style={{ marginTop: "22px", textAlign: "center", fontSize: "12.5px", color: "rgba(226, 241, 248, 0.75)" }}>
                <div>Học viên hoặc Nhà tuyển dụng?</div>
                <Link
                  to="/"
                  style={{
                    display: "inline-block",
                    marginTop: "4px",
                    color: "#67d2e6",
                    fontWeight: 600,
                    textDecoration: "underline",
                    textUnderlineOffset: "3px"
                  }}
                >
                  Tra cứu bằng cấp công khai
                </Link>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
