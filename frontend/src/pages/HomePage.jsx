import React, { useState, useEffect } from "react";
import { QrCode, Lock, Globe, Sparkles } from "lucide-react";
import { getAllCertificates } from "../services/web3Service";
import { dashboardApi } from "../services/apiService";
import CertificateVerifier from "../components/CertificateVerifier";

export default function HomePage() {
  const [certs] = useState(() => getAllCertificates());
  const [overviewStats, setOverviewStats] = useState(null);

  useEffect(() => {
    dashboardApi.getOverviewStats()
      .then(res => {
        if (res.success && res.data) {
          setOverviewStats(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const totalCerts = overviewStats ? overviewStats.totalCertificates : certs.length;
  const issuedCerts = overviewStats ? overviewStats.totalOnchain : certs.filter(c => c.status === "ISSUED_ON_CHAIN").length;
  const totalCourses = overviewStats ? `${overviewStats.totalCourses}+` : "4+";

  return (
    <div>
      {/* Hero Section with Modern Architectural Grid & Aura */}
      <section className="hero-spotlight-section" style={{ textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "900px", position: "relative", zIndex: 1 }}>
          
          <div style={{
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

          <h1 style={{
            fontSize: "clamp(32px, 4.6vw, 48px)",
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: "-1.2px",
            marginBottom: "16px",
            color: "var(--text-primary)",
            textWrap: "balance"
          }}>
            Xác Thực Chứng Chỉ Tiếng Anh <br />
            <span className="text-gradient">Minh Bạch &amp; Chống Giả Mạo</span>
          </h1>

          <p style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            maxWidth: "600px",
            margin: "0 auto 32px",
            lineHeight: 1.65
          }}>
            Kiểm tra tức thì tính hợp lệ của chứng chỉ <strong>IELTS, TOEIC, VSTEP</strong> trực tiếp từ dữ liệu định danh bất biến — không cần đăng nhập.
          </p>

          {/* Embedded Single-row Spotlight Verification Widget */}
          <CertificateVerifier syncUrl={false} />

        </div>
      </section>

      {/* Unified Trust Stats Strip */}
      <section style={{ padding: "8px 0 56px" }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          <div className="trust-stats-strip">
            <div className="trust-stat-item">
              <div style={{ fontSize: "30px", fontWeight: 800, color: "var(--primary)", lineHeight: 1.1 }}>{issuedCerts}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "6px", fontWeight: 500 }}>Chứng chỉ đã phát hành</div>
            </div>
            <div className="trust-stat-item">
              <div style={{ fontSize: "30px", fontWeight: 800, color: "var(--accent-gold)", lineHeight: 1.1 }}>{totalCourses}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "6px", fontWeight: 500 }}>Chuẩn kỳ thi quốc tế</div>
            </div>
            <div className="trust-stat-item">
              <div style={{ fontSize: "30px", fontWeight: 800, color: "var(--success-text)", lineHeight: 1.1 }}>100%</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "6px", fontWeight: 500 }}>Bất biến &amp; Minh bạch</div>
            </div>
            <div className="trust-stat-item">
              <div style={{ fontSize: "30px", fontWeight: 800, color: "var(--primary)", lineHeight: 1.1 }}>&lt; 2s</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "6px", fontWeight: 500 }}>Thời gian đối soát QR</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section style={{ padding: "50px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "12px", color: "var(--text-primary)" }}>
              Công Nghệ Đột Phá Cho Khảo Thí
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
              Giải quyết trọn vẹn bài toán xác thực bằng cấp giữa Học viên – Trung tâm – Doanh nghiệp tuyển dụng.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            
            <div className="glass-panel" style={{ padding: "32px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--primary-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <Lock size={24} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: 700, marginBottom: "10px", color: "var(--text-primary)" }}>Định Danh Độc Bản Bất Biến</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.65 }}>
                Chứng chỉ được cấp theo chuẩn định danh độc bản: Gắn chặt vào danh tính học viên, khóa vĩnh viễn tính năng chuyển nhượng nhằm ngăn chặn triệt để hành vi mua bán bằng cấp.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "32px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--accent-gold-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <Globe size={24} color="var(--accent-gold)" />
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: 700, marginBottom: "10px", color: "var(--text-primary)" }}>Lưu Trữ Dữ Liệu Phân Tán</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.65 }}>
                Phôi bằng PDF và dữ liệu xác thực được lưu trên mạng lưu trữ phân tán, bảo đảm thông tin tồn tại vĩnh viễn không bị xóa mờ hay phụ thuộc vào một máy chủ duy nhất.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "32px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--success-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <QrCode size={24} color="var(--success-text)" />
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: 700, marginBottom: "10px", color: "var(--text-primary)" }}>Thẩm Định Tức Thì Bằng QR</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.65 }}>
                Nhà tuyển dụng chỉ cần dùng camera điện thoại quét mã QR in trên bằng để đối soát trực tiếp với dữ liệu gốc của hệ thống trong vòng chưa tới 2 giây.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section style={{ padding: "50px 0 90px" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "12px", color: "var(--text-primary)" }}>
              Quy Trình Cấp Phát & Thẩm Định
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Đơn giản, minh bạch và an toàn tuyệt đối</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
            {[
              { step: "01", title: "Khảo Thí & Nhập Điểm", desc: "Học viên hoàn thành bài thi IELTS/TOEIC, hội đồng khảo thí nhập kết quả vào hệ thống khảo thí." },
              { step: "02", title: "Tự Động Sinh PDF & QR", desc: "Hệ thống tự động kết xuất phôi bằng PDF chuẩn in ấn có nhúng mã QR định danh độc bản." },
              { step: "03", title: "Ký Xác Thực & Cấp Bằng", desc: "Quản trị viên ký số điện tử để cấp phát và ghi nhận chứng chỉ vĩnh viễn trên sổ cái bảo mật." },
              { step: "04", title: "Xác Thực Công Khai", desc: "Bất kỳ ai cũng có thể quét QR hoặc tra mã bằng để kiểm tra tính hợp pháp tức thì." }
            ].map((item, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: "24px", position: "relative" }}>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--primary)", opacity: 0.85, marginBottom: "8px" }}>
                  {item.step}
                </div>
                <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px", color: "var(--text-primary)" }}>{item.title}</h4>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.55 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
