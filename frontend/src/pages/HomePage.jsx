import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Search, QrCode, Lock, Globe, Award, ArrowRight, CheckCircle2, Sparkles, Layers } from "lucide-react";
import { getAllCertificates } from "../services/web3Service";
import { dashboardApi } from "../services/apiService";

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
      {/* Hero Section */}
      <section style={{ padding: "80px 0 60px", textAlign: "center", position: "relative" }}>
        <div className="container" style={{ maxWidth: "920px" }}>
          
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            background: "var(--primary-bg)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-full)",
            fontSize: "13px",
            color: "var(--primary)",
            marginBottom: "24px",
            fontWeight: 600
          }}>
            <Sparkles size={16} />
            <span>Nền Tảng Quản Lý & Xác Thực Bằng Tiếng Anh Trên Blockchain 4.0</span>
          </div>

          <h1 style={{
            fontSize: "46px",
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: "-1px",
            marginBottom: "20px",
            color: "var(--text-primary)"
          }}>
            Thẩm Định Chứng Chỉ Tiếng Anh <br />
            <span className="text-gradient">Chống Làm Giả Tuyệt Đối Bằng SBT & IPFS</span>
          </h1>

          <p style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            maxWidth: "720px",
            margin: "0 auto 36px",
            lineHeight: 1.65
          }}>
            Giải pháp cấp phát và đối soát chứng chỉ IELTS, TOEIC, VSTEP minh bạch. 
            Mỗi chứng chỉ là một <strong>Soulbound Token (SBT)</strong> gắn liền danh tính học viên, 
            không thể tẩy xóa hay chuyển nhượng.
          </p>

          {/* Action CTA Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <Link to="/verify" className="btn btn-primary" style={{ padding: "14px 28px", fontSize: "16px" }}>
              <Search size={18} />
              Tra Cứu Bằng Ngay
            </Link>

            <Link to="/scanner" className="btn btn-outline" style={{ padding: "14px 28px", fontSize: "16px" }}>
              <QrCode size={18} />
              Quét Mã QR Xác Thực
            </Link>

            <Link to="/login" className="btn btn-outline" style={{ padding: "14px 24px", fontSize: "15px" }}>
              <Lock size={16} />
              Cổng Quản Trị Trung Tâm
            </Link>
          </div>

        </div>
      </section>

      {/* Metrics Banner */}
      <section style={{ padding: "20px 0 50px" }}>
        <div className="container" style={{ maxWidth: "1000px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px"
          }}>
            <div className="glass-panel" style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "var(--primary)" }}>{issuedCerts}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>Chứng chỉ On-Chain (MySQL)</div>
            </div>
            <div className="glass-panel" style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "var(--accent-gold)" }}>{totalCourses}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>Kỳ thi hỗ trợ (IELTS, TOEIC, VSTEP)</div>
            </div>
            <div className="glass-panel" style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "var(--success-text)" }}>100%</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>Bất biến & Chống giả mạo</div>
            </div>
            <div className="glass-panel" style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "var(--primary)" }}>&lt; 2s</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>Tốc độ đối soát QR on-chain</div>
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
              <h3 style={{ fontSize: "19px", fontWeight: 700, marginBottom: "10px", color: "var(--text-primary)" }}>Soulbound Token (SBT)</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.65 }}>
                Chứng chỉ được đúc theo chuẩn Soulbound: Gắn chặt vào danh tính học viên, khóa vĩnh viễn tính năng chuyển nhượng nhằm ngăn chặn triệt để hành vi mua bán bằng cấp.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "32px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--accent-gold-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <Globe size={24} color="var(--accent-gold)" />
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: 700, marginBottom: "10px", color: "var(--text-primary)" }}>Lưu Trữ Bất Biến IPFS</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.65 }}>
                Phôi bằng PDF và metadata được đẩy lên mạng lưu trữ phân tán IPFS (Pinata), bảo đảm dữ liệu tồn tại vĩnh viễn không bị xóa mờ hay phụ thuộc vào một máy chủ duy nhất.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "32px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--success-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <QrCode size={24} color="var(--success-text)" />
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: 700, marginBottom: "10px", color: "var(--text-primary)" }}>Thẩm Định Tức Thì Bằng QR</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.65 }}>
                Nhà tuyển dụng chỉ cần dùng camera điện thoại quét mã QR in trên bằng giấy để đối soát trực tiếp với Smart Contract on-chain trong vòng chưa tới 2 giây.
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
              { step: "01", title: "Khảo Thí & Nhập Điểm", desc: "Học viên hoàn thành bài thi IELTS/TOEIC, hội đồng khảo thí nhập kết quả vào hệ thống MySQL." },
              { step: "02", title: "Tự Động Sinh PDF & QR", desc: "Hệ thống tự động kết xuất phôi bằng PDF chuẩn in ấn có nhúng mã QR định danh độc bản." },
              { step: "03", title: "Ký & Đúc SBT On-Chain", desc: "Quản trị viên ký giao dịch qua MetaMask để ghi nhận chứng chỉ vĩnh viễn vào Blockchain & IPFS." },
              { step: "04", title: "Xác Thực Công Khai", desc: "Bất kỳ ai cũng có thể quét QR hoặc tra mã on-chain để kiểm tra tính hợp pháp 100%." }
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
