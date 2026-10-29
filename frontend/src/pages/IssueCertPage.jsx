import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, FileCheck, ArrowLeft, Sparkles, Wallet, CheckCircle2, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { issueCertificateOnChain, INITIAL_STUDENTS, INITIAL_COURSES, connectMetaMask } from "../services/web3Service";
import CertificateCard from "../components/CertificateCard";

export default function IssueCertPage({ wallet, setWallet, user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    certificate_code: `CERT-IELTS-2026-${Math.floor(100 + Math.random() * 900)}`,
    student_name: "Phạm Quốc Hưng",
    student_code: "HV2026-0199",
    email: "quochung.pham@gmail.com",
    wallet_address: "0x91F84e8B291823eF4512C890123456789ABCDEF9",
    course_code: "IELTS-ACAD",
    course_name: "IELTS Academic Master",
    score: "7.5 Overall",
    listening: "8.0",
    reading: "7.5",
    writing: "7.0",
    speaking: "7.5",
    issue_date: new Date().toISOString().slice(0, 10),
    expiry_date: "2028-10-29",
    status: "ISSUED_ON_CHAIN"
  });

  const [loading, setLoading] = useState(false);
  const [successCert, setSuccessCert] = useState(null);

  const handleStudentSelect = (e) => {
    const studentId = Number(e.target.value);
    const found = INITIAL_STUDENTS.find(s => s.id === studentId);
    if (found) {
      setFormData(prev => ({
        ...prev,
        student_name: found.full_name,
        student_code: found.student_code,
        email: found.email,
        wallet_address: found.wallet_address
      }));
    }
  };

  const handleCourseSelect = (e) => {
    const courseCode = e.target.value;
    const found = INITIAL_COURSES.find(c => c.course_code === courseCode);
    if (found) {
      setFormData(prev => ({
        ...prev,
        course_code: found.course_code,
        course_name: found.course_name
      }));
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user?.role === "STAFF") {
        // Cán bộ chỉ được tạo bản nháp (PENDING)
        await new Promise(r => setTimeout(r, 600));
        const draftCert = {
          ...formData,
          status: "PENDING",
          token_id: null,
          tx_hash: null,
          ipfs_hash: null
        };
        const saved = await issueCertificateOnChain(draftCert);
        alert(`Lưu bản nháp thành công cho học viên ${saved.student_name}! Trạng thái: PENDING.`);
        navigate("/admin/certificates");
        return;
      }

      // ADMIN: Đúc On-Chain với MetaMask
      if (!wallet) {
        const acc = await connectMetaMask();
        setWallet(acc);
      }

      await new Promise(r => setTimeout(r, 1200));
      const newCert = await issueCertificateOnChain(formData);
      setSuccessCert(newCert);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      alert("Lỗi khi xử lý: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "36px 0 80px" }}>
      <div className="container" style={{ maxWidth: "1280px" }}>
        
        <div style={{ marginBottom: "20px" }}>
          <Link to="/admin/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "14px" }}>
            <ArrowLeft size={16} /> Quay lại Dashboard
          </Link>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800 }}>
            Cấp Phát Chứng Chỉ & <span className="text-gradient">Đúc Soulbound Token On-Chain</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Dữ liệu sẽ được ghi vĩnh viễn vào Smart Contract và phôi bằng được lưu trữ bất biến trên IPFS.
          </p>
        </div>

        {/* 2-Column Split Screen Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(350px, 450px) 1fr", gap: "32px", alignItems: "start" }}>
          
          {/* Left Column: Input Form */}
          <div className="glass-panel" style={{ padding: "28px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileCheck size={20} color="var(--primary)" />
              Thông Tin Khảo Thí
            </h3>

            <form onSubmit={handleIssue}>
              
              <div className="form-group">
                <label className="form-label">Chọn học viên mẫu (Hoặc tự nhập)</label>
                <select onChange={handleStudentSelect} className="form-select">
                  <option value="">-- Chọn học viên đã đăng ký --</option>
                  {INITIAL_STUDENTS.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Họ tên học viên</label>
                  <input
                    type="text"
                    required
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mã học viên</label>
                  <input
                    type="text"
                    required
                    value={formData.student_code}
                    onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Khóa học / Kỳ thi tiếng Anh</label>
                <select value={formData.course_code} onChange={handleCourseSelect} className="form-select">
                  {INITIAL_COURSES.map(c => (
                    <option key={c.course_code} value={c.course_code}>{c.course_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Điểm số Overall</label>
                <input
                  type="text"
                  required
                  placeholder="VD: 7.5 Overall hoặc 850/990"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* Sub-scores 4 skills */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "20px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Listening</label>
                  <input
                    type="text"
                    value={formData.listening}
                    onChange={(e) => setFormData({ ...formData, listening: e.target.value })}
                    className="form-input"
                    style={{ padding: "8px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Reading</label>
                  <input
                    type="text"
                    value={formData.reading}
                    onChange={(e) => setFormData({ ...formData, reading: e.target.value })}
                    className="form-input"
                    style={{ padding: "8px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Writing</label>
                  <input
                    type="text"
                    value={formData.writing}
                    onChange={(e) => setFormData({ ...formData, writing: e.target.value })}
                    className="form-input"
                    style={{ padding: "8px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Speaking</label>
                  <input
                    type="text"
                    value={formData.speaking}
                    onChange={(e) => setFormData({ ...formData, speaking: e.target.value })}
                    className="form-input"
                    style={{ padding: "8px" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ ví MetaMask học viên</label>
                <input
                  type="text"
                  value={formData.wallet_address}
                  onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                  className="form-input"
                  style={{ fontSize: "12px" }}
                />
              </div>

              {/* Role-based Action Buttons */}
              {user?.role === "STAFF" ? (
                <div>
                  <div style={{
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fde68a",
                    marginBottom: "14px"
                  }}>
                    ⚠️ <strong>Giới hạn quyền Cán bộ (STAFF):</strong> Bạn chỉ có quyền tạo bản nháp (Draft). Quản trị viên (ADMIN) sẽ là người duyệt và ký ví MetaMask để đúc On-Chain.
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "14px", fontSize: "15px" }}
                  >
                    {loading ? "Đang lưu..." : "Lưu Bản Nháp (Chờ Admin Ký On-Chain)"}
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-gold"
                  style={{ width: "100%", padding: "14px", fontSize: "15px", marginTop: "10px" }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Đang gửi transaction lên Blockchain...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Ký MetaMask & Cấp Bằng On-Chain
                    </>
                  )}
                </button>
              )}

            </form>
          </div>

          {/* Right Column: Live Certificate Preview */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 600 }}>
                XEM TRƯỚC BẢN IN THỜI GIAN THỰC (LIVE PREVIEW)
              </span>
              <span className="badge badge-info">Tự động cập nhật</span>
            </div>

            <CertificateCard cert={formData} isPreview={true} />
          </div>

        </div>

        {/* Success Modal */}
        {successCert && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}>
            <div className="glass-panel" style={{ maxWidth: "520px", width: "100%", padding: "32px", textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#10b981", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <CheckCircle2 size={36} color="#04121e" />
              </div>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#34d399", marginBottom: "8px" }}>
                Đúc Chứng Chỉ On-Chain Thành Công!
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
                Chứng chỉ <strong>{successCert.certificate_code}</strong> đã được ghi vào Blockchain với Token ID <strong>#{successCert.token_id}</strong>.
              </p>

              <div style={{ background: "rgba(0,0,0,0.4)", padding: "12px", borderRadius: "8px", fontSize: "12px", textAlign: "left", marginBottom: "24px" }}>
                <div><strong>Tx Hash:</strong> <span style={{ color: "var(--primary)" }}>{successCert.tx_hash}</span></div>
                <div style={{ marginTop: "4px" }}><strong>IPFS CID:</strong> <span style={{ color: "var(--accent-gold)" }}>{successCert.ipfs_hash}</span></div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <Link to={`/verify?code=${successCert.certificate_code}`} className="btn btn-primary">
                  Xem Trang Thẩm Định
                </Link>
                <button
                  type="button"
                  onClick={() => { setSuccessCert(null); navigate("/admin/certificates"); }}
                  className="btn btn-outline"
                >
                  Về Danh Sách Bằng
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
