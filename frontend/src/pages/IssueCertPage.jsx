import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, FileCheck, Sparkles, Wallet, CheckCircle2, RefreshCw, Eye } from "lucide-react";
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

  // Quy chuẩn làm tròn điểm IELTS quốc tế (British Council / IDP / Cambridge)
  const calculateIeltsOverall = (l, r, w, s) => {
    const nums = [parseFloat(l), parseFloat(r), parseFloat(w), parseFloat(s)];
    if (nums.some(isNaN)) return formData.score;
    const avg = nums.reduce((a, b) => a + b, 0) / 4;
    const dec = avg - Math.floor(avg);
    let rounded;
    if (dec < 0.25) rounded = Math.floor(avg);
    else if (dec < 0.75) rounded = Math.floor(avg) + 0.5;
    else rounded = Math.floor(avg) + 1.0;
    return `${rounded.toFixed(1)} Overall`;
  };

  const handleSubScoreChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    if (formData.course_code.includes("IELTS")) {
      const overall = calculateIeltsOverall(
        field === "listening" ? val : formData.listening,
        field === "reading" ? val : formData.reading,
        field === "writing" ? val : formData.writing,
        field === "speaking" ? val : formData.speaking
      );
      updated.score = overall;
    } else if (formData.course_code.includes("TOEIC")) {
      const l = parseInt(field === "listening" ? val : formData.listening) || 0;
      const r = parseInt(field === "reading" ? val : formData.reading) || 0;
      updated.score = `${l + r}/990`;
    }
    setFormData(updated);
  };

  const handleDateChange = (issueDate) => {
    const d = new Date(issueDate);
    if (!isNaN(d.getTime())) {
      d.setFullYear(d.getFullYear() + 2); // Chuẩn hiệu lực 2 năm quốc tế
      setFormData({
        ...formData,
        issue_date: issueDate,
        expiry_date: d.toISOString().slice(0, 10)
      });
    }
  };

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
        await new Promise(r => setTimeout(r, 600));
        const draftCert = {
          ...formData,
          status: "PENDING",
          token_id: null,
          tx_hash: null,
          ipfs_hash: null
        };
        const saved = await issueCertificateOnChain(draftCert);
        alert(`Lưu bản nháp thành công cho học viên ${saved.student_name}! Trạng thái: PENDING (Chờ Quản trị viên ký đúc On-Chain).`);
        navigate("/admin/certificates");
        return;
      }

      // ADMIN: Đúc On-Chain với MetaMask
      if (!wallet) {
        const acc = await connectMetaMask();
        setWallet(acc);
      }

      await new Promise(r => setTimeout(r, 1100));
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
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: "26px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-primary)" }}>
          Cấp Phát Chứng Chỉ & <span className="text-gradient">Đúc Soulbound Token On-Chain</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Thông tin khảo thí sẽ được ghi nhận vào Smart Contract và phôi bằng được lưu trữ bất biến trên IPFS.
        </p>
      </div>

      {/* 2-Column Split Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 460px) 1fr", gap: "28px", alignItems: "start" }}>
        
        {/* Left Column: Input Form */}
        <div className="glass-panel" style={{ padding: "26px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
            <FileCheck size={19} color="var(--primary)" />
            Thông Tin Khảo Thí & Học Viên
          </h3>

          <form onSubmit={handleIssue}>
            
            <div className="form-group">
              <label className="form-label">Chọn học viên mẫu (Hoặc tự nhập bên dưới)</label>
              <select onChange={handleStudentSelect} className="form-select">
                <option value="">-- Chọn học viên có sẵn --</option>
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

            {/* Sub-scores 4 skills with auto-calculated overall */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "20px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Listening</label>
                <input
                  type="text"
                  value={formData.listening}
                  onChange={(e) => handleSubScoreChange("listening", e.target.value)}
                  className="form-input"
                  style={{ padding: "8px 10px", textAlign: "center" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Reading</label>
                <input
                  type="text"
                  value={formData.reading}
                  onChange={(e) => handleSubScoreChange("reading", e.target.value)}
                  className="form-input"
                  style={{ padding: "8px 10px", textAlign: "center" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Writing</label>
                <input
                  type="text"
                  value={formData.writing}
                  onChange={(e) => handleSubScoreChange("writing", e.target.value)}
                  className="form-input"
                  style={{ padding: "8px 10px", textAlign: "center" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Speaking</label>
                <input
                  type="text"
                  value={formData.speaking}
                  onChange={(e) => handleSubScoreChange("speaking", e.target.value)}
                  className="form-input"
                  style={{ padding: "8px 10px", textAlign: "center" }}
                />
              </div>
            </div>

            {/* Date pickers with 2-year auto validity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label className="form-label" style={{ fontSize: "12px" }}>Ngày thi / cấp bằng</label>
                <input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: "12px" }}>Hạn hiệu lực (Chuẩn 2 năm)</label>
                <input
                  type="date"
                  readOnly
                  value={formData.expiry_date}
                  className="form-input"
                  style={{ opacity: 0.85 }}
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
                  background: "var(--warning-bg)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "12px",
                  color: "var(--warning-text)",
                  marginBottom: "14px"
                }}>
                  ⚠️ <strong>Thẩm quyền Cán bộ (STAFF):</strong> Bạn có quyền soạn thảo bản nháp (Draft). Quản trị viên (ADMIN) sẽ là người duyệt và ký giao dịch MetaMask để đúc On-Chain.
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
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>
              XEM TRƯỚC PHÔI BẰNG THỜI GIAN THỰC (LIVE PREVIEW)
            </span>
            <span className="badge badge-info">Tự động đồng bộ</span>
          </div>

          <CertificateCard cert={formData} isPreview={true} />
        </div>

      </div>

      {/* Success Modal */}
      {successCert && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "var(--bg-modal-backdrop)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "20px"
        }}>
          <div className="glass-panel" style={{
            maxWidth: "520px",
            width: "100%",
            padding: "36px",
            textAlign: "center",
            background: "var(--bg-surface-elevated)"
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "var(--success-bg)",
              color: "var(--success-color)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px"
            }}>
              <CheckCircle2 size={36} color="var(--success-color)" />
            </div>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "var(--success-text)", marginBottom: "8px" }}>
              Đúc Chứng Chỉ On-Chain Thành Công!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
              Chứng chỉ <strong>{successCert.certificate_code}</strong> đã được ghi vĩnh viễn vào Smart Contract với Token ID <strong>#{successCert.token_id}</strong>.
            </p>

            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "var(--radius-md)", fontSize: "12px", textAlign: "left", marginBottom: "24px" }}>
              <div><strong>Tx Hash:</strong> <span style={{ color: "var(--primary)" }}>{successCert.tx_hash}</span></div>
              <div style={{ marginTop: "4px" }}><strong>IPFS CID:</strong> <span style={{ color: "var(--accent-gold)" }}>{successCert.ipfs_hash}</span></div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Link to={`/verify?code=${successCert.certificate_code}`} className="btn btn-primary">
                Xem Cổng Thẩm Định
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
  );
}
