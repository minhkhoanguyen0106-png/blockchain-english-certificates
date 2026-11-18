import React, { useState, useEffect, useRef } from "react";
import { QrCode, Lock, Globe, Sparkles, CheckCircle2, Search, ArrowUpRight } from "lucide-react";
import { getAllCertificates } from "../services/web3Service";
import { dashboardApi } from "../services/apiService";
import CertificateVerifier from "../components/CertificateVerifier";

function RevealSection({ children, style, id }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} className={visible ? "is-visible" : ""} style={style}>
      {children}
    </section>
  );
}

function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const duration = 850;
    const startTime = performance.now();
    let frameId;

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <>{display}{suffix}</>;
}

function LivingQrVerificationIllustration() {
  return (
    <svg
      viewBox="0 0 460 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: "430px", height: "auto", display: "block", margin: "0 auto" }}
      aria-label="Minh họa trực quan quy trình quét QR và xác thực chứng chỉ tức thì"
    >
      <defs>
        <linearGradient id="liveBlobGrad" x1="60" y1="30" x2="400" y2="330" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d8f0fc" />
          <stop offset="100%" stopColor="#e6f5fd" />
        </linearGradient>
        <linearGradient id="liveCardBorder" x1="120" y1="55" x2="340" y2="295" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id="liveBeamGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0" />
          <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
        <filter id="liveCardShadow" x="80" y="30" width="300" height="310" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.11" />
        </filter>
      </defs>

      {/* Soft Breathing Pastel Sky Blob (Deliverest Signature) */}
      <g className="live-blob-breathe">
        <path
          d="M112 58C178 16 286 24 348 74C410 124 426 210 384 274C342 338 242 356 154 332C66 308 26 242 46 168C66 94 46 100 112 58Z"
          fill="url(#liveBlobGrad)"
        />
        <circle cx="76" cy="96" r="9" fill="#bae6fd" opacity="0.8" />
        <circle cx="394" cy="272" r="12" fill="#bae6fd" opacity="0.7" />
        <circle cx="380" cy="84" r="6" fill="#7dd3fc" opacity="0.75" />
      </g>

      {/* Main Levitating QR Verification Clipboard Card */}
      <g className="live-card-levitate" filter="url(#liveCardShadow)">
        <rect x="118" y="54" width="224" height="248" rx="22" fill="#ffffff" stroke="url(#liveCardBorder)" strokeWidth="1.6" />

        {/* Subtle Top Header Pill */}
        <rect x="142" y="76" width="52" height="20" rx="10" fill="#e0f2fe" />
        <text x="168" y="89.5" textAnchor="middle" fill="#0284c7" fontSize="10" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
          EN • SBT
        </text>
        <circle cx="314" cy="86" r="5" fill="#10b981" />

        {/* Interactive QR Code Box with Animated Laser Sweep */}
        <rect x="142" y="112" width="66" height="66" rx="12" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1.4" />
        <g fill="#0f2c42">
          <rect x="152" y="122" width="16" height="16" rx="3" />
          <rect x="156" y="126" width="8" height="8" rx="1.5" fill="#f0f9ff" />
          <rect x="182" y="122" width="16" height="16" rx="3" />
          <rect x="186" y="126" width="8" height="8" rx="1.5" fill="#f0f9ff" />
          <rect x="152" y="152" width="16" height="16" rx="3" />
          <rect x="156" y="156" width="8" height="8" rx="1.5" fill="#f0f9ff" />
          <rect x="174" y="144" width="6" height="6" rx="1.5" fill="#0284c7" />
          <rect x="184" y="148" width="6" height="6" rx="1.5" />
          <rect x="192" y="156" width="6" height="12" rx="1.5" />
          <rect x="174" y="160" width="12" height="6" rx="1.5" fill="#0284c7" />
        </g>
        {/* Sweeping Laser Scan Beam */}
        <rect x="145" y="116" width="60" height="3.5" rx="2" fill="url(#liveBeamGrad)" className="live-scan-beam" />

        {/* Morphing Live Verification Data Bars */}
        <rect x="222" y="118" width="96" height="8" rx="4" fill="#0f2c42" opacity="0.82" className="live-bar-pulse-1" />
        <rect x="222" y="136" width="76" height="6.5" rx="3.25" fill="#38bdf8" opacity="0.75" className="live-bar-pulse-2" />
        <rect x="222" y="152" width="88" height="6.5" rx="3.25" fill="#cbd5e1" className="live-bar-pulse-3" />
        <rect x="222" y="168" width="54" height="6.5" rx="3.25" fill="#10b981" opacity="0.65" className="live-bar-pulse-1" />

        {/* Divider */}
        <line x1="142" y1="202" x2="318" y2="202" stroke="#e2e8f0" strokeWidth="1.2" strokeDasharray="4 4" />

        {/* Self-Drawing Cursive Digital Signature (Deliverest Section 5 Signature Effect!) */}
        <text x="142" y="224" fill="#94a3b8" fontSize="9.5" fontWeight="700" letterSpacing="0.8" fontFamily="Plus Jakarta Sans, sans-serif">
          CHỮ KÝ XÁC THỰC
        </text>
        <path
          d="M144 258 C154 236 164 236 166 254 C168 266 178 242 188 248 C196 253 200 264 212 250 C222 238 232 256 248 248"
          stroke="#0284c7"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="live-signature-draw"
        />

        {/* Soft Gold Seal Badge */}
        <circle cx="294" cy="250" r="21" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.8" />
        <path
          d="M285 250 L291.5 256.5 L303 243.5"
          stroke="#d97706"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="live-signature-draw"
        />
      </g>

      {/* Offset-Phase Floating Verification Pill A (Top-Right) */}
      <g className="live-badge-float-a">
        <rect x="302" y="34" width="122" height="36" rx="18" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.2" />
        <circle cx="322" cy="52" r="9" fill="#dcfce7" />
        <path d="M318.5 52 L321 54.5 L326 49.5" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="338" y="55.5" fill="#0f172a" fontSize="11" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
          Hợp lệ 100%
        </text>
      </g>

      {/* Offset-Phase Floating Pill B (Bottom-Left) */}
      <g className="live-badge-float-b">
        <rect x="36" y="252" width="126" height="38" rx="19" fill="#0f2c42" />
        <circle cx="56" cy="271" r="6" fill="#38bdf8" />
        <text x="70" y="274.5" fill="#ffffff" fontSize="11" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
          Đối soát &lt; 2 giây
        </text>
      </g>
    </svg>
  );
}

export default function HomePage() {
  const [certs] = useState(() => getAllCertificates());
  const [overviewStats, setOverviewStats] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const verifierRef = useRef(null);

  useEffect(() => {
    dashboardApi.getOverviewStats()
      .then(res => {
        if (res.success && res.data) {
          setOverviewStats(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const issuedCerts = overviewStats ? overviewStats.totalOnchain : certs.filter(c => c.status === "ISSUED_ON_CHAIN").length;
  const totalCoursesNum = overviewStats ? Number(overviewStats.totalCourses || 4) : 4;

  const features = [
    {
      icon: Lock,
      bg: "var(--primary-bg)",
      color: "var(--primary)",
      title: "Định Danh Độc Bản Bất Biến",
      desc: "Chứng chỉ được cấp theo chuẩn định danh độc bản: Gắn chặt vào danh tính học viên, khóa vĩnh viễn tính năng chuyển nhượng nhằm ngăn chặn triệt để hành vi mua bán bằng cấp."
    },
    {
      icon: Globe,
      bg: "var(--accent-gold-bg)",
      color: "var(--accent-gold)",
      title: "Lưu Trữ Dữ Liệu Phân Tán",
      desc: "Phôi bằng PDF và dữ liệu xác thực được lưu trên mạng lưu trữ phân tán, bảo đảm thông tin tồn tại vĩnh viễn không bị xóa mờ hay phụ thuộc vào một máy chủ duy nhất."
    },
    {
      icon: QrCode,
      bg: "var(--success-bg)",
      color: "var(--success-text)",
      title: "Thẩm Định Tức Thì Bằng QR",
      desc: "Nhà tuyển dụng chỉ cần dùng camera điện thoại quét mã QR in trên bằng để đối soát trực tiếp với dữ liệu gốc của hệ thống trong vòng chưa tới 2 giây."
    }
  ];

  const workflowSteps = [
    { step: "01", title: "Khảo Thí & Nhập Điểm", desc: "Học viên hoàn thành bài thi IELTS/TOEIC/VSTEP, hội đồng khảo thí nhập kết quả vào hệ thống." },
    { step: "02", title: "Tự Động Sinh PDF & QR", desc: "Hệ thống tự động kết xuất phôi bằng PDF chuẩn in ấn có nhúng mã QR định danh độc bản." },
    { step: "03", title: "Ký Xác Thực & Cấp Bằng", desc: "Quản trị viên ký số điện tử để cấp phát và ghi nhận chứng chỉ vĩnh viễn trên sổ cái bảo mật." },
    { step: "04", title: "Xác Thực Công Khai", desc: "Bất kỳ ai cũng có thể quét QR hoặc tra mã bằng để kiểm tra tính hợp pháp tức thì." }
  ];

  return (
    <div>
      {/* Hero Section with Staggered Entrance + Campty Hand-Drawn Accent */}
      <section className="hero-spotlight-section" style={{ textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "900px", position: "relative", zIndex: 1 }}>

          <div className="hero-anim hero-anim-1" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-full)",
            fontSize: "12.5px",
            color: "var(--primary)",
            marginBottom: "22px",
            fontWeight: 600,
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)"
          }}>
            <Sparkles size={14} />
            <span>Cổng Xác Thực Bằng Cấp Tiếng Anh Điện Tử</span>
          </div>

          <h1 className="hero-anim hero-anim-2" style={{
            fontSize: "clamp(32px, 4.6vw, 48px)",
            fontWeight: 800,
            lineHeight: 1.22,
            letterSpacing: "-1.2px",
            marginBottom: "20px",
            color: "var(--text-primary)",
            textWrap: "balance"
          }}>
            Xác Thực Chứng Chỉ Tiếng Anh <br />
            <span style={{ position: "relative", display: "inline-block" }}>
              <span className="text-gradient">Minh Bạch &amp; Chống Giả Mạo</span>
              {/* Hand-drawn Smooth Swoosh Underline (Campty Signature) */}
              <svg
                viewBox="0 0 320 18"
                fill="none"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "2%",
                  bottom: "-10px",
                  width: "96%",
                  height: "14px",
                  pointerEvents: "none",
                  overflow: "visible"
                }}
              >
                <path
                  d="M4 12 C88 3 224 2 316 11"
                  stroke="#0ea5e9"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="hero-swoosh-path"
                  opacity="0.72"
                />
              </svg>
              {/* Delicate 3-Ray Sparkle Flourish */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="hero-sparkle"
                style={{ position: "absolute", right: "-24px", top: "-8px", pointerEvents: "none" }}
              >
                <path d="M4 12 L10 6" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M12 10 L20 4" stroke="#6366f1" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M13 17 L21 15" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="hero-anim hero-anim-3" style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            maxWidth: "600px",
            margin: "0 auto 32px",
            lineHeight: 1.65
          }}>
            Kiểm tra tức thì tính hợp lệ của chứng chỉ <strong>IELTS, TOEIC, VSTEP</strong> trực tiếp từ dữ liệu định danh bất biến — không cần đăng nhập.
          </p>

          {/* Embedded Single-row Spotlight Verification Widget */}
          <div className="hero-anim hero-anim-4">
            <CertificateVerifier ref={verifierRef} syncUrl={false} />
          </div>

        </div>
      </section>

      {/* Unified Trust Stats Strip with Smooth Count-Up */}
      <section className="hero-anim hero-anim-5" style={{ padding: "8px 0 64px" }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          <div className="trust-stats-strip">
            <div className="trust-stat-item">
              <div style={{ fontSize: "30px", fontWeight: 800, color: "var(--primary)", lineHeight: 1.1 }}>
                <AnimatedNumber value={issuedCerts} />
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "6px", fontWeight: 500 }}>Chứng chỉ đã phát hành</div>
            </div>
            <div className="trust-stat-item">
              <div style={{ fontSize: "30px", fontWeight: 800, color: "var(--accent-gold)", lineHeight: 1.1 }}>
                <AnimatedNumber value={totalCoursesNum} suffix="+" />
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "6px", fontWeight: 500 }}>Chuẩn kỳ thi quốc tế</div>
            </div>
            <div className="trust-stat-item">
              <div style={{ fontSize: "30px", fontWeight: 800, color: "var(--success-text)", lineHeight: 1.1 }}>
                <AnimatedNumber value={100} suffix="%" />
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "6px", fontWeight: 500 }}>Bất biến &amp; Minh bạch</div>
            </div>
            <div className="trust-stat-item">
              <div style={{ fontSize: "30px", fontWeight: 800, color: "var(--primary)", lineHeight: 1.1 }}>&lt; 2s</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "6px", fontWeight: 500 }}>Thời gian đối soát QR</div>
            </div>
          </div>
        </div>
      </section>

      {/* Living Interactive Verification Showcase (Deliverest Section 5 Inspired) */}
      <RevealSection style={{ padding: "36px 0 64px" }}>
        <div className="container" style={{ maxWidth: "1060px" }}>
          <div className="living-verify-grid">
            <div className="reveal-header">
              <div className="section-eyebrow">XÁC THỰC TRỰC QUAN</div>
              <h2 style={{ fontSize: "clamp(26px, 3.2vw, 34px)", fontWeight: 800, lineHeight: 1.24, letterSpacing: "-0.6px", color: "var(--text-primary)", marginBottom: "14px" }}>
                Đối Soát Chứng Chỉ Trong 2 Giây — Minh Bạch Từng Chi Tiết
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.68, marginBottom: "22px" }}>
                Mỗi văn bằng phát hành đều mang một mã QR định danh duy nhất gắn liền chữ ký số của trung tâm. Nhà tuyển dụng hoặc cơ sở đào tạo chỉ cần nhập mã hoặc quét QR để xác minh ngay bản gốc.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "26px" }}>
                {[
                  "Tự động phát hiện bằng bị thu hồi hoặc chỉnh sửa dữ liệu",
                  "Hiển thị đầy đủ điểm thành phần IELTS / TOEIC / VSTEP",
                  "Tải phôi PDF gốc và sao chép liên kết chia sẻ tức thì"
                ].map((line, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>
                    <CheckCircle2 size={17} color="var(--success-text)" style={{ flexShrink: 0 }} />
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => verifierRef.current?.focusSearch()}
                  className="btn btn-primary"
                  style={{ borderRadius: "9999px", padding: "11px 22px" }}
                >
                  <Search size={16} />
                  Nhập Mã Tra Cứu
                  <ArrowUpRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => verifierRef.current?.openQrScanner()}
                  className="btn btn-outline"
                  style={{ borderRadius: "9999px", padding: "11px 20px" }}
                >
                  <QrCode size={16} />
                  Quét Mã QR Ngay
                </button>
              </div>
            </div>

            <div className="reveal-card" style={{ "--stagger": 1 }}>
              <LivingQrVerificationIllustration />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Core Features with Two-Phase Scroll Reveal + Elastic Icon Pop */}
      <RevealSection style={{ padding: "56px 0" }}>
        <div className="container">
          <div className="reveal-header" style={{ textAlign: "center", marginBottom: "44px" }}>
            <div className="section-eyebrow">CÔNG NGHỆ CỐT LÕI</div>
            <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "12px", color: "var(--text-primary)", letterSpacing: "-0.6px" }}>
              Công Nghệ Đột Phá Cho Khảo Thí
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "600px", margin: "0 auto" }}>
              Giải quyết trọn vẹn bài toán xác thực bằng cấp giữa Học viên – Trung tâm – Doanh nghiệp tuyển dụng.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="glass-panel reveal-card motion-feature-card"
                  style={{ padding: "32px", "--stagger": idx }}
                >
                  <div
                    className="reveal-icon-pop"
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "14px",
                      background: feat.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                      "--stagger": idx
                    }}
                  >
                    <Icon size={25} color={feat.color} />
                  </div>
                  <h3 style={{ fontSize: "19px", fontWeight: 700, marginBottom: "10px", color: "var(--text-primary)" }}>{feat.title}</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.65 }}>
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      {/* Interactive Workflow Section with Animated Progress Connector */}
      <RevealSection style={{ padding: "56px 0 96px" }}>
        <div className="container">
          <div className="reveal-header" style={{ textAlign: "center", marginBottom: "48px" }}>
            <div className="section-eyebrow">QUY TRÌNH VẬN HÀNH</div>
            <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "12px", color: "var(--text-primary)", letterSpacing: "-0.6px" }}>
              Quy Trình Cấp Phát &amp; Thẩm Định
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Đơn giản, minh bạch và an toàn tuyệt đối</p>
          </div>

          <div className="workflow-grid-wrap">
            <div className="workflow-connector-track" aria-hidden="true">
              <div className="workflow-connector-fill" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "20px" }}>
              {workflowSteps.map((item, idx) => {
                const isActive = activeStep === idx;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setActiveStep(idx)}
                    onClick={() => setActiveStep(idx)}
                    className={`glass-panel reveal-card motion-step-card ${isActive ? "is-active-step" : ""}`}
                    style={{ padding: "26px 24px", "--stagger": idx }}
                  >
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: 800,
                      marginBottom: "16px",
                      background: isActive ? "var(--primary)" : "var(--primary-bg)",
                      color: isActive ? "#ffffff" : "var(--primary)",
                      transition: "all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      transform: isActive ? "scale(1.06)" : "scale(1)"
                    }}>
                      {item.step}
                    </div>
                    <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>{item.title}</h4>
                    <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}
