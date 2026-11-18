import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, User, ArrowLeft, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
import { authApi } from "../services/apiService";

function BlockchainIllustration() {
  return (
    <svg
      viewBox="0 0 460 390"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: "390px", height: "auto", display: "block", margin: "0 auto" }}
      aria-label="Minh họa hệ thống xác thực chứng chỉ Blockchain"
    >
      <defs>
        <linearGradient id="blobOuter" x1="60" y1="40" x2="390" y2="350" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d8eef7" />
          <stop offset="100%" stopColor="#e8f5fa" />
        </linearGradient>
        <linearGradient id="blobInner" x1="110" y1="90" x2="340" y2="310" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#b8dfef" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#cce8f4" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="cubeTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="cubeLeft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f3d5e" />
          <stop offset="100%" stopColor="#0a2940" />
        </linearGradient>
        <linearGradient id="cubeRight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1b587d" />
          <stop offset="100%" stopColor="#123f5d" />
        </linearGradient>
        <linearGradient id="shieldGrad" x1="190" y1="125" x2="270" y2="235" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#143d59" />
        </linearGradient>
        <linearGradient id="goldBadge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Organic Pastel Background Blobs (matching reference soft aesthetic) */}
      <path
        d="M118 68C178 24 275 30 335 76C395 122 418 205 378 272C338 339 245 362 162 340C79 318 28 258 46 184C64 110 58 112 118 68Z"
        fill="url(#blobOuter)"
      />
      <path
        d="M150 105C204 72 282 82 322 126C362 170 364 242 318 282C272 322 192 326 140 286C88 246 96 138 150 105Z"
        fill="url(#blobInner)"
      />

      {/* Soft Bokeh Circles */}
      <circle cx="88" cy="84" r="11" fill="#cce8f4" opacity="0.7" />
      <circle cx="386" cy="112" r="8" fill="#bae6fd" opacity="0.8" />
      <circle cx="372" cy="316" r="14" fill="#d8eef7" opacity="0.85" />
      <circle cx="76" cy="298" r="7" fill="#bae6fd" opacity="0.65" />

      {/* Ground shadow ellipse */}
      <ellipse cx="228" cy="306" rx="115" ry="16" fill="#0f3d5e" opacity="0.1" />

      {/* Interconnecting Cryptographic Hash Chain Lines */}
      <g stroke="#2980a8" strokeWidth="2.2" strokeDasharray="5 5" strokeLinecap="round" opacity="0.75">
        <line x1="120" y1="158" x2="195" y2="188" />
        <line x1="336" y1="154" x2="262" y2="188" />
        <line x1="138" y1="264" x2="200" y2="232" />
        <line x1="322" y1="262" x2="258" y2="232" />
        <line x1="228" y1="78" x2="228" y2="124" />
      </g>

      {/* Glowing Node Dots along Chain Links */}
      <circle cx="158" cy="173" r="4" fill="#0ea5e9" />
      <circle cx="298" cy="171" r="4" fill="#0ea5e9" />
      <circle cx="170" cy="248" r="3.5" fill="#38bdf8" />
      <circle cx="288" cy="247" r="3.5" fill="#38bdf8" />
      <circle cx="228" cy="100" r="3.5" fill="#fbbf24" />

      {/* Top Floating Isometric Block (Genesis Block) */}
      <g className="login-float-med">
        <polygon points="228,44 256,59 228,74 200,59" fill="url(#cubeTop)" />
        <polygon points="200,59 228,74 228,100 200,85" fill="url(#cubeLeft)" />
        <polygon points="256,59 228,74 228,100 256,85" fill="url(#cubeRight)" />
        <circle cx="228" cy="59" r="3.5" fill="#ffffff" opacity="0.9" />
      </g>

      {/* Left Upper Isometric Block */}
      <g className="login-float-slow">
        <polygon points="108,126 138,142 108,158 78,142" fill="#5cc4d8" />
        <polygon points="78,142 108,158 108,188 78,172" fill="#143d59" />
        <polygon points="138,142 108,158 108,188 138,172" fill="#1f5c7e" />
        <rect x="86" y="159" width="12" height="3" rx="1.5" fill="#7dd3fc" transform="skewY(26)" />
      </g>

      {/* Right Upper Floating Block (like the floating gift/box in reference) */}
      <g className="login-float-med">
        <polygon points="344,116 376,133 344,150 312,133" fill="url(#goldBadge)" />
        <polygon points="312,133 344,150 344,182 312,165" fill="#102a43" />
        <polygon points="376,133 344,150 344,182 376,165" fill="#1d4b6e" />
        {/* Tiny Lock Icon on Right Block */}
        <circle cx="344" cy="133" r="4.5" fill="#ffffff" opacity="0.92" />
      </g>

      {/* Bottom Left Mini Node Block */}
      <g className="login-float-med">
        <polygon points="124,242 150,256 124,270 98,256" fill="#38bdf8" />
        <polygon points="98,256 124,270 124,294 98,280" fill="#0f3450" />
        <polygon points="150,256 124,270 124,294 150,280" fill="#1b5478" />
      </g>

      {/* Bottom Right Mini Node Block */}
      <g className="login-float-slow">
        <polygon points="332,240 358,254 332,268 306,254" fill="#5cc4d8" />
        <polygon points="306,254 332,268 332,292 306,278" fill="#0f3450" />
        <polygon points="358,254 332,268 332,292 358,278" fill="#1b5478" />
      </g>

      {/* Center Hero Pedestal + Verified Blockchain Certificate Card */}
      <g className="login-float-slow">
        {/* Elevated Certificate Card */}
        <rect x="166" y="132" width="124" height="148" rx="18" fill="#ffffff" stroke="#0f3d5e" strokeWidth="2.5" />
        <rect x="174" y="140" width="108" height="132" rx="12" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1.2" strokeDasharray="4 3" />

        {/* Central Verification Shield */}
        <path
          d="M228 152L258 164V186C258 205 245 220 228 227C211 220 198 205 198 186V164L228 152Z"
          fill="url(#shieldGrad)"
        />
        <path
          d="M217 189L225 197L241 179"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Certificate Text Lines */}
        <rect x="192" y="238" width="72" height="6" rx="3" fill="#143d59" opacity="0.85" />
        <rect x="204" y="250" width="48" height="4.5" rx="2.25" fill="#5cc4d8" />

        {/* Gold Seal Ribbon at corner */}
        <circle cx="272" cy="146" r="14" fill="url(#goldBadge)" stroke="#ffffff" strokeWidth="2.5" />
        <path d="M267 146L270.5 149.5L277.5 142.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Subtle Floating Hash Pills */}
      <g opacity="0.9">
        <rect x="74" y="208" width="66" height="20" rx="10" fill="#ffffff" stroke="#bae6fd" strokeWidth="1.2" />
        <text x="107" y="221" textAnchor="middle" fill="#143d59" fontSize="8.5" fontFamily="monospace" fontWeight="700">
          0x9f...a4c
        </text>
      </g>
      <g opacity="0.9">
        <rect x="316" y="202" width="70" height="20" rx="10" fill="#ffffff" stroke="#bae6fd" strokeWidth="1.2" />
        <text x="351" y="215" textAnchor="middle" fill="#0284c7" fontSize="8.5" fontFamily="monospace" fontWeight="700">
          SBT #721
        </text>
      </g>
    </svg>
  );
}

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
      <div className="login-split-card">

        {/* LEFT PANEL: Crisp White Background + Organic S-Wave Edge + Blockchain Illustration */}
        <div
          className="login-illustration-panel"
          style={{
            position: "relative",
            background: "#ffffff",
            padding: "32px 36px 26px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            zIndex: 2
          }}
        >
          {/* Organic S-Wave SVG Divider overlapping right edge into dark panel */}
          <svg
            viewBox="0 0 110 600"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              top: 0,
              right: "-1px",
              height: "100%",
              width: "108px",
              pointerEvents: "none",
              zIndex: 3
            }}
          >
            <path
              d="M15,0 C-12,115 95,215 98,350 C100,455 58,535 12,600 L110,600 L110,0 Z"
              fill="#14364d"
            />
          </svg>

          {/* Top-Left Brand Crest */}
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "11px", textDecoration: "none", position: "relative", zIndex: 4, width: "fit-content" }}>
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
              <div style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-0.4px", color: "#0f2c42", lineHeight: 1.15 }}>
                CERT<span style={{ color: "#0284c7" }}>CHAIN</span>
              </div>
              <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>
                English Testing Center
              </div>
            </div>
          </Link>

          {/* Center Bespoke Blockchain Illustration */}
          <div style={{ position: "relative", zIndex: 4, paddingRight: "44px", margin: "6px 0" }}>
            <BlockchainIllustration />
          </div>

          {/* Bottom-Left Subtle Institutional Attribution */}
          <div style={{ position: "relative", zIndex: 4, fontSize: "10.5px", color: "#94a3b8", lineHeight: 1.5 }}>
            <div>© 2026 CertChain English Testing Center</div>
            <div style={{ fontWeight: 600, color: "#64748b" }}>Powered by Blockchain Verification</div>
          </div>
        </div>

        {/* RIGHT PANEL: Rich Deep Ocean-Slate Login Form */}
        <div style={{
          position: "relative",
          background: "#14364d",
          padding: "32px 44px 26px 36px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
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
              <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "15px" }}>CERTCHAIN</span>
            </Link>

            <Link
              to="/"
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                color: "rgba(186, 214, 230, 0.72)",
                fontSize: "12.5px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color var(--transition-fast)"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(186, 214, 230, 0.72)"; }}
            >
              <ArrowLeft size={14} /> Về trang chủ
            </Link>
          </div>

          {/* Centered Form Block */}
          <div style={{ width: "100%", maxWidth: "320px", margin: "24px auto" }}>
            <h2 style={{ fontSize: "30px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", marginBottom: "6px" }}>
              Đăng Nhập
            </h2>
            <p style={{ fontSize: "13px", color: "rgba(186, 214, 230, 0.72)", marginBottom: "26px" }}>
              Cổng nội bộ Quản trị viên &amp; Cán bộ Khảo thí
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
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

              <div style={{ marginBottom: "20px" }}>
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

          {/* Bottom-Right Subtle Support Text (matching reference corner footer) */}
          <div style={{ textAlign: "right", fontSize: "10.5px", color: "rgba(186, 214, 230, 0.52)", lineHeight: 1.5 }}>
            <div>Gặp sự cố đăng nhập?</div>
            <div style={{ color: "#67d2e6" }}>Liên hệ Quản trị viên Trung tâm</div>
          </div>
        </div>

      </div>
    </div>
  );
}
