import React, { useState, useEffect, useRef } from "react";
import { QrCode, ShieldCheck, Globe, Sparkles, CheckCircle2, Search, ArrowUpRight } from "lucide-react";
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
        <filter id="livePillShadow" x="-25%" y="-40%" width="150%" height="200%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.12" />
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
        <rect x="142" y="76" width="60" height="20" rx="10" fill="#e0f2fe" />
        <text x="172" y="89.5" textAnchor="middle" fill="#0284c7" fontSize="10" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
          EN • CERT
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
          ĐÃ XÁC NHẬN
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

      {/* Offset-Phase Floating Verification Pill A (Top-Right — Flies in from right edge!) */}
      <g className="reveal-fly-right">
        <g className="live-badge-float-a" filter="url(#livePillShadow)">
          <rect x="304" y="30" width="124" height="36" rx="18" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.2" />
          <circle cx="324" cy="48" r="9" fill="#dcfce7" />
          <path d="M320.5 48 L323 50.5 L328 45.5" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="340" y="51.5" fill="#0f172a" fontSize="11" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
            Hợp lệ 100%
          </text>
        </g>
      </g>

      {/* Offset-Phase Floating Pill B (Bottom-Left — Flies in from left edge!) */}
      <g className="reveal-fly-left">
        <g className="live-badge-float-b" filter="url(#livePillShadow)">
          <rect x="28" y="276" width="132" height="38" rx="19" fill="#0f2c42" />
          <circle cx="48" cy="295" r="5.5" fill="#38bdf8" />
          <text x="62" y="298.5" fill="#ffffff" fontSize="11" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
            Tra cứu &lt; 2 giây
          </text>
        </g>
      </g>
    </svg>
  );
}

export default function HomePage() {
  const [activeStep, setActiveStep] = useState(0);
  const verifierRef = useRef(null);

  const supportedExams = [
    { code: "IELTS", detail: "Thang điểm 0.0 – 9.0", color: "var(--primary)" },
    { code: "TOEIC", detail: "Thang điểm 10 – 990", color: "var(--accent-gold)" },
    { code: "VSTEP", detail: "Khung bậc B1 • B2 • C1", color: "var(--success-text)" },
    { code: "TOEFL iBT", detail: "Thang điểm 0 – 120", color: "#6366f1" }
  ];

  const features = [
    {
      icon: ShieldCheck,
      bg: "var(--primary-bg)",
      color: "var(--primary)",
      title: "Thông Tin Chính Thống",
      desc: "Kết quả điểm số, xếp loại và tình trạng hiệu lực được đối chiếu trực tiếp với hồ sơ gốc từ Trung tâm Khảo thí, loại bỏ hoàn toàn nguy cơ bằng giả."
    },
    {
      icon: Globe,
      bg: "var(--accent-gold-bg)",
      color: "var(--accent-gold)",
      title: "Tra Cứu Mọi Lúc, Mọi Nơi",
      desc: "Không cần tạo tài khoản hay cài đặt ứng dụng. Chỉ cần điện thoại hoặc máy tính có internet là học viên và nhà tuyển dụng có thể kiểm tra ngay."
    },
    {
      icon: QrCode,
      bg: "var(--success-bg)",
      color: "var(--success-text)",
      title: "Quét Mã QR Trong 2 Giây",
      desc: "Đưa camera quét mã QR in trên chứng chỉ giấy hoặc tải ảnh chụp văn bằng lên để xem chi tiết điểm thi mà không cần nhập mã thủ công."
    }
  ];

  const workflowSteps = [
    { step: "01", title: "Lấy Mã Số Hoặc Mã QR", desc: "Tìm dãy mã chứng chỉ in trên văn bằng hoặc mở sẵn ảnh chụp mã QR của chứng chỉ cần kiểm tra." },
    { step: "02", title: "Nhập Mã Hoặc Quét QR", desc: "Gõ mã vào ô tìm kiếm phía trên, hoặc bấm biểu tượng QR để quét bằng camera hay chọn ảnh từ máy." },
    { step: "03", title: "Xem Kết Quả & Điểm Thi", desc: "Thông tin học viên, điểm từng kỹ năng, xếp loại và trạng thái hiệu lực sẽ hiển thị rõ ràng ngay lập tức." },
    { step: "04", title: "Tải PDF Hoặc Chia Sẻ", desc: "Tải bản chứng chỉ PDF sắc nét để nộp hồ sơ hoặc sao chép đường link gửi trực tiếp cho nhà tuyển dụng." }
  ];

  return (
    <div>
      {/* Hero Section with Staggered Entrance + Campty Hand-Drawn Accent */}
      <section className="hero-spotlight-section" style={{ textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "900px", position: "relative", zIndex: 1 }}>

          <div className="nav-drop-item" style={{
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
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
            "--drop-delay": "0.1s"
          }}>
            <Sparkles size={14} />
            <span>Cổng Tra Cứu Chứng Chỉ Tiếng Anh Công Khai</span>
          </div>

          <div style={{ overflow: "hidden", paddingBottom: "16px", marginBottom: "6px" }}>
            <h1 className="mask-slide-left" style={{
              fontSize: "clamp(34px, 4.7vw, 50px)",
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: "-1.4px",
              marginBottom: 0,
              color: "var(--text-primary)",
              textWrap: "balance",
              "--slide-delay": "0.18s"
            }}>
              Tra Cứu Chứng Chỉ Tiếng Anh <br />
              <span style={{ position: "relative", display: "inline-block" }}>
                <span className="text-editorial-serif">Nhanh Chóng &amp; Chính Xác</span>
                {/* Hand-drawn Smooth Swoosh Underline */}
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
                    stroke="#5cc4d8"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    className="hero-swoosh-path"
                    opacity="0.85"
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
                  style={{ position: "absolute", right: "-24px", top: "-6px", pointerEvents: "none" }}
                >
                  <path d="M4 12 L10 6" stroke="#5cc4d8" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M12 10 L20 4" stroke="#f0b44c" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M13 17 L21 15" stroke="#5cc4d8" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
          </div>

          <p className="hero-anim hero-anim-3" style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            maxWidth: "600px",
            margin: "0 auto 32px",
            lineHeight: 1.65
          }}>
            Nhập mã số trên văn bằng hoặc quét mã QR để kiểm tra kết quả thi <strong>IELTS, TOEIC, VSTEP</strong> của học viên — hoàn toàn miễn phí, không cần đăng nhập.
          </p>

          {/* Embedded Single-row Spotlight Verification Widget */}
          <div className="hero-anim hero-anim-4">
            <CertificateVerifier ref={verifierRef} syncUrl={false} />
          </div>

        </div>
      </section>

      {/* Supported English Certificates Strip */}
      <section className="hero-anim hero-anim-5" style={{ padding: "8px 0 64px" }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          <div className="trust-stats-strip">
            {supportedExams.map((exam) => (
              <div key={exam.code} className="trust-stat-item">
                <div style={{ fontSize: "24px", fontWeight: 800, color: exam.color, letterSpacing: "-0.4px", lineHeight: 1.15 }}>
                  {exam.code}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "6px", fontWeight: 500 }}>
                  {exam.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Living Interactive Verification Showcase (Opposing Split-Door Entrance — Stickerz Signature) */}
      <RevealSection style={{ padding: "36px 0 64px", overflowX: "clip" }}>
        <div className="container" style={{ maxWidth: "1060px" }}>
          <div className="living-verify-grid">
            <div className="reveal-split-left">
              <div className="section-eyebrow">TRA CỨU DỄ DÀNG</div>
              <h2 style={{ fontSize: "clamp(26px, 3.2vw, 34px)", fontWeight: 800, lineHeight: 1.24, letterSpacing: "-0.6px", color: "var(--text-primary)", marginBottom: "14px" }}>
                Kiểm Tra Thông Tin Bằng Cấp Chỉ Trong Vài Giây
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.68, marginBottom: "22px" }}>
                Dù bạn là học viên cần tải lại bản điện tử hay nhà tuyển dụng muốn kiểm tra hồ sơ ứng viên, mọi thông tin điểm số và tình trạng bằng đều hiển thị rõ ràng ngay lập tức.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "26px" }}>
                {[
                  "Xem đầy đủ điểm từng kỹ năng Nghe, Nói, Đọc, Viết và xếp loại",
                  "Nhận biết ngay chứng chỉ còn hiệu lực hay đã bị thu hồi",
                  "Tải bản in PDF sắc nét hoặc chia sẻ đường link tra cứu cho nhà tuyển dụng"
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
                  Nhập Mã Chứng Chỉ
                  <ArrowUpRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => verifierRef.current?.openQrScanner()}
                  className="btn btn-outline"
                  style={{ borderRadius: "9999px", padding: "11px 20px" }}
                >
                  <QrCode size={16} />
                  Quét Mã QR
                </button>
              </div>
            </div>

            <div className="reveal-split-right">
              <LivingQrVerificationIllustration />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Core Features with Two-Phase Scroll Reveal + Elastic Icon Pop */}
      <RevealSection style={{ padding: "56px 0" }}>
        <div className="container">
          <div className="reveal-header" style={{ textAlign: "center", marginBottom: "44px" }}>
            <div className="section-eyebrow">TIỆN ÍCH TRA CỨU</div>
            <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "12px", color: "var(--text-primary)", letterSpacing: "-0.6px" }}>
              Rõ Ràng Cho Học Viên, An Tâm Cho Nhà Tuyển Dụng
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "600px", margin: "0 auto" }}>
              Mọi thông tin bạn cần để kiểm tra và sử dụng chứng chỉ tiếng Anh đều sẵn sàng tại một nơi duy nhất.
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
            <div className="section-eyebrow">HƯỚNG DẪN TRA CỨU</div>
            <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "12px", color: "var(--text-primary)", letterSpacing: "-0.6px" }}>
              Cách Kiểm Tra Chứng Chỉ Trong 4 Bước
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Đơn giản, ai cũng có thể thực hiện chỉ trong chưa đầy một phút</p>
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
