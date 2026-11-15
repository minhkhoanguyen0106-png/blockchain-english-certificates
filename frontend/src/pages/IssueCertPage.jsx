import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FileCheck, Sparkles, CheckCircle2, RefreshCw, Download, ExternalLink, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";
import { issueCertificateOnChain, INITIAL_STUDENTS, INITIAL_COURSES, connectMetaMask, isMetaMaskInstalled } from "../services/web3Service";
import { certificateApi, studentApi, courseApi } from "../services/apiService";
import { computeOverallScore, getExpiryDateForCourse, validateSubScores, detectCourseType, CERTIFICATE_TYPES } from "../services/scoreEngine";
import CertificateCard from "../components/CertificateCard";

export default function IssueCertPage({ wallet, setWallet, user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [studentsList, setStudentsList] = useState(INITIAL_STUDENTS);
  const [coursesList, setCoursesList] = useState(INITIAL_COURSES);
  const [pendingDrafts, setPendingDrafts] = useState([]);
  const [selectedDraftCode, setSelectedDraftCode] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [formData, setFormData] = useState({
    certificate_code: `CERT-IELTS-2026-${Math.floor(100 + Math.random() * 900)}`,
    student_name: "",
    student_code: "",
    email: "",
    wallet_address: "",
    course_code: "IELTS-ACAD",
    course_name: "IELTS Academic Master",
    score: "",
    listening: "",
    reading: "",
    writing: "",
    speaking: "",
    issue_date: new Date().toISOString().slice(0, 10),
    expiry_date: "2028-10-29",
    status: "DRAFT"
  });

  const [loading, setLoading] = useState(false);
  const [successCert, setSuccessCert] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const loadDraftIntoForm = (draft) => {
    setSelectedDraftCode(draft.certificate_code);
    setFormData({
      id: draft.id,
      certificate_code: draft.certificate_code,
      student_name: draft.student_name || "",
      student_code: draft.student_code || "",
      email: draft.email || "",
      wallet_address: draft.wallet_address || "",
      course_code: draft.course_code || "IELTS-ACAD",
      course_name: draft.course_name || "IELTS Academic Master",
      score: draft.score_overall || draft.score || "",
      listening: draft.score_listening || "",
      reading: draft.score_reading || "",
      writing: draft.score_writing || "",
      speaking: draft.score_speaking || "",
      issue_date: draft.issue_date || new Date().toISOString().slice(0, 10),
      expiry_date: draft.expiry_date || "",
      status: draft.status || "PENDING"
    });
  };

  // Load students, courses, and pending drafts from MySQL
  useEffect(() => {
    async function loadOptions() {
      try {
        const [stuRes, crsRes, draftRes] = await Promise.allSettled([
          studentApi.getStudents(),
          courseApi.getCourses(),
          certificateApi.getCertificates({ status: "PENDING", limit: 50 })
        ]);
        if (stuRes.status === "fulfilled" && stuRes.value?.success && Array.isArray(stuRes.value.data) && stuRes.value.data.length > 0) {
          setStudentsList(stuRes.value.data);
        }
        if (crsRes.status === "fulfilled" && crsRes.value?.success && Array.isArray(crsRes.value.data) && crsRes.value.data.length > 0) {
          setCoursesList(crsRes.value.data);
        }
        if (draftRes.status === "fulfilled" && draftRes.value?.success && Array.isArray(draftRes.value.data)) {
          setPendingDrafts(draftRes.value.data);

          // Kiểm tra nếu có query param ?code=... từ URL
          const codeParam = searchParams.get("code");
          if (codeParam) {
            const draft = draftRes.value.data.find(d => d.certificate_code === codeParam);
            if (draft) {
              loadDraftIntoForm(draft);
            }
          }
        }
      } catch {
        // fallback to initial
      }
    }
    loadOptions();
  }, [searchParams]);

  const handleSubScoreChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const overall = computeOverallScore(updated.course_code, {
      listening: field === "listening" ? val : updated.listening,
      reading: field === "reading" ? val : updated.reading,
      writing: field === "writing" ? val : updated.writing,
      speaking: field === "speaking" ? val : updated.speaking
    });
    updated.score = overall;
    setFormData(updated);
  };

  const handleDateChange = (issueDate) => {
    const expiry = getExpiryDateForCourse(formData.course_code, issueDate);
    setFormData({
      ...formData,
      issue_date: issueDate,
      expiry_date: expiry
    });
  };

  const handleDraftSelect = (e) => {
    const code = e.target.value;
    setSelectedDraftCode(code);
    if (!code) {
      setSelectedStudentId("");
      setFormData({
        certificate_code: `CERT-IELTS-2026-${Math.floor(100 + Math.random() * 900)}`,
        student_name: "",
        student_code: "",
        email: "",
        wallet_address: "",
        course_code: "IELTS-ACAD",
        course_name: "IELTS Academic Master",
        score: "",
        listening: "",
        reading: "",
        writing: "",
        speaking: "",
        issue_date: new Date().toISOString().slice(0, 10),
        expiry_date: "2028-10-29",
        status: "DRAFT"
      });
      return;
    }
    const draft = pendingDrafts.find(d => d.certificate_code === code);
    if (draft) {
      loadDraftIntoForm(draft);
      const matchStu = studentsList.find(s => s.student_code === draft.student_code);
      if (matchStu) setSelectedStudentId(matchStu.id);
    }
  };

  const handleStudentSelect = (e) => {
    const studentId = Number(e.target.value);
    setSelectedStudentId(studentId || "");
    const found = studentsList.find(s => s.id === studentId);
    if (found) {
      setFormData(prev => ({
        ...prev,
        student_name: found.full_name,
        student_code: found.student_code,
        email: found.email || "",
        wallet_address: found.wallet_address || ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        student_name: "",
        student_code: "",
        email: "",
        wallet_address: ""
      }));
    }
  };

  const handleRejectDraft = async () => {
    if (!selectedDraftCode) {
      alert("Vui lòng chọn hồ sơ nháp cần từ chối.");
      return;
    }
    const reason = prompt("Nhập lý do từ chối hồ sơ nháp (chuyển lại cho Cán bộ khảo thí điều chỉnh):", "Điểm số các kỹ năng chưa chính xác với biên bản chấm thi.");
    if (!reason) return;

    try {
      setLoading(true);
      const cert = pendingDrafts.find(d => d.certificate_code === selectedDraftCode);
      if (!cert?.id) throw new Error("Không tìm thấy ID của bản nháp.");
      const res = await certificateApi.rejectDraft(cert.id, reason);
      if (res?.success) {
        alert(`Đã từ chối bản nháp ${selectedDraftCode} thành công. Hồ sơ đã được chuyển lại cho Cán bộ khảo thí.`);
        navigate("/admin/certificates");
      } else {
        alert("Lỗi khi từ chối: " + (res?.message || "Không xác định"));
      }
    } catch (err) {
      alert("Lỗi khi từ chối bản nháp: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (e) => {
    const courseCode = e.target.value;
    const found = coursesList.find(c => c.course_code === courseCode);
    if (found) {
      const overall = computeOverallScore(found.course_code, {
        listening: formData.listening,
        reading: formData.reading,
        writing: formData.writing,
        speaking: formData.speaking
      });
      const expiry = getExpiryDateForCourse(found.course_code, formData.issue_date);
      setFormData(prev => ({
        ...prev,
        course_code: found.course_code,
        course_name: found.course_name,
        score: overall,
        expiry_date: expiry
      }));
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();

    if (!formData.student_name || !formData.student_code) {
      alert("Vui lòng chọn học viên từ CSDL hoặc nhập đầy đủ họ tên và mã học viên.");
      return;
    }

    if (!formData.wallet_address) {
      alert("Vui lòng nhập hoặc liên kết địa chỉ ví MetaMask của học viên trước khi tiếp tục.");
      return;
    }

    const validation = validateSubScores(formData.course_code, formData);
    if (!validation.isValid) {
      alert(`Dữ liệu điểm chưa hợp lệ:\n- ${validation.errors.join("\n- ")}`);
      return;
    }

    if (user?.role === "STAFF") {
      setLoading(true);
      try {
        const result = await certificateApi.createDraft({
          certificate_code: formData.certificate_code,
          student_code: formData.student_code,
          course_code: formData.course_code,
          score_overall: formData.score,
          score_listening: formData.listening || null,
          score_reading: formData.reading || null,
          score_writing: formData.writing || null,
          score_speaking: formData.speaking || null,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date || null
        });
        if (!result?.success || !result.data?.id) {
          throw new Error(result?.message || "Máy chủ chưa xác nhận lưu bản nháp.");
        }
        alert(`Đã lưu bản nháp ${formData.certificate_code}. Chứng chỉ đang chờ Quản trị viên kiểm duyệt.`);
        navigate("/admin/certificates");
      } catch (err) {
        alert("Lỗi khi lưu bản nháp: " + (err.message || err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (user?.role !== "ADMIN") {
      alert("Tài khoản hiện tại không có quyền phát hành chứng chỉ.");
      return;
    }

    // Bật màn hình đối soát thông tin trước khi ký MetaMask
    setShowConfirmModal(true);
  };

  const executeMintOnChain = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      if (!isMetaMaskInstalled()) {
        throw new Error("Hãy cài MetaMask trước khi phát hành on-chain.");
      }

      let activeWallet = wallet;
      if (!activeWallet?.signer) {
        activeWallet = await connectMetaMask();
      }
      if (!activeWallet?.signer) {
        throw new Error("Không lấy được signer từ MetaMask. Hãy kết nối ví rồi thử lại.");
      }
      if (activeWallet && setWallet) {
        setWallet(activeWallet);
      }

      const newCert = await issueCertificateOnChain(formData, activeWallet);
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
            Thông Tin Khảo Thí & Học Viên (MySQL & Blockchain)
          </h3>

          <form onSubmit={handleIssue}>

            {/* Nếu là ADMIN: Hiển thị bộ chọn hồ sơ nháp chờ duyệt */}
            {user?.role === "ADMIN" && (
              <div className="form-group" style={{
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px dashed rgba(59, 130, 246, 0.35)",
                padding: "14px",
                borderRadius: "var(--radius-sm)",
                marginBottom: "18px"
              }}>
                <label className="form-label" style={{ color: "var(--primary)", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📋 Chọn hồ sơ nháp chờ duyệt (PENDING)</span>
                  {pendingDrafts.length > 0 && (
                    <span className="badge badge-warning" style={{ fontSize: "11px", padding: "2px 8px" }}>
                      {pendingDrafts.length} hồ sơ chờ duyệt
                    </span>
                  )}
                </label>
                <select
                  value={selectedDraftCode}
                  onChange={handleDraftSelect}
                  className="form-select"
                >
                  <option value="">-- Chọn hồ sơ nháp để đối soát & phê duyệt --</option>
                  {pendingDrafts.map(d => (
                    <option key={d.id} value={d.certificate_code}>
                      {d.certificate_code} — {d.student_name} ({d.course_name}: {d.score_overall || d.score})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Theo nguyên tắc Four-Eyes, Admin đối soát điểm do Khảo thí nhập trước khi ký phát hành on-chain.
                </span>
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Chọn học viên từ CSDL</label>
              <select value={selectedStudentId} onChange={handleStudentSelect} className="form-select">
                <option value="">-- Chọn học viên có sẵn --</option>
                {studentsList.map(s => (
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
                  placeholder="Chọn học viên hoặc nhập họ tên..."
                  value={formData.student_name}
                  onChange={(e) => {
                    setSelectedStudentId("");
                    setFormData({ ...formData, student_name: e.target.value });
                  }}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mã học viên</label>
                <input
                  type="text"
                  required
                  placeholder="HV2026-XXXX..."
                  value={formData.student_code}
                  onChange={(e) => {
                    setSelectedStudentId("");
                    setFormData({ ...formData, student_code: e.target.value });
                  }}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Khóa học / Kỳ thi tiếng Anh</label>
              <select value={formData.course_code} onChange={handleCourseSelect} className="form-select">
                {coursesList.map(c => (
                  <option key={c.course_code} value={c.course_code}>{c.course_name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Điểm số Overall</label>
                <span style={{ fontSize: "11px", color: "var(--success-text, #10b981)", fontWeight: 600 }}>
                  🔒 Tự động tính toán (Không thể sửa tay)
                </span>
              </div>
              <input
                type="text"
                readOnly
                placeholder="Chưa có điểm..."
                value={formData.score}
                className="form-input"
                style={{
                  background: "var(--bg-card-subtle, rgba(255,255,255,0.05))",
                  cursor: "not-allowed",
                  fontWeight: 700,
                  color: "var(--primary, #3b82f6)",
                  borderColor: "rgba(59, 130, 246, 0.3)"
                }}
                title="Điểm số Overall được tự động tính toán từ 4 kỹ năng theo quy chế thi, không thể chỉnh sửa thủ công."
              />
            </div>

            {/* Sub-scores 4 skills with auto-calculated overall */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label className="form-label" style={{ marginBottom: 0, fontSize: "12px" }}>Điểm số các kỹ năng thành phần</label>
                {user?.role === "ADMIN" && (
                  <span style={{ fontSize: "11px", color: "var(--primary, #3b82f6)", fontWeight: 600 }}>
                    🔒 Dữ liệu đã niêm phong
                  </span>
                )}
              </div>

              {user?.role === "ADMIN" && (
                <div style={{
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "12px",
                  color: "var(--primary, #3b82f6)",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <span>🔒 <strong>Nguyên tắc Bốn Mắt (Four-Eyes):</strong> Dữ liệu điểm do Nhân viên Khảo thí nhập liệu đã được niêm phong. Quản trị viên chỉ đối soát, phê duyệt và ký phát hành on-chain, không được tự ý sửa điểm. Nếu điểm sai, vui lòng từ chối bản nháp để Khảo thí điều chỉnh lại.</span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Listening</label>
                  <input
                    type="text"
                    readOnly={user?.role === "ADMIN"}
                    placeholder="—"
                    value={formData.listening}
                    onChange={(e) => handleSubScoreChange("listening", e.target.value)}
                    className="form-input"
                    style={{
                      padding: "8px 10px",
                      textAlign: "center",
                      background: user?.role === "ADMIN" ? "var(--bg-card-subtle, rgba(255,255,255,0.04))" : undefined,
                      cursor: user?.role === "ADMIN" ? "not-allowed" : undefined
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Reading</label>
                  <input
                    type="text"
                    readOnly={user?.role === "ADMIN"}
                    placeholder="—"
                    value={formData.reading}
                    onChange={(e) => handleSubScoreChange("reading", e.target.value)}
                    className="form-input"
                    style={{
                      padding: "8px 10px",
                      textAlign: "center",
                      background: user?.role === "ADMIN" ? "var(--bg-card-subtle, rgba(255,255,255,0.04))" : undefined,
                      cursor: user?.role === "ADMIN" ? "not-allowed" : undefined
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Writing</label>
                  <input
                    type="text"
                    readOnly={user?.role === "ADMIN"}
                    placeholder="—"
                    value={formData.writing}
                    onChange={(e) => handleSubScoreChange("writing", e.target.value)}
                    className="form-input"
                    style={{
                      padding: "8px 10px",
                      textAlign: "center",
                      background: user?.role === "ADMIN" ? "var(--bg-card-subtle, rgba(255,255,255,0.04))" : undefined,
                      cursor: user?.role === "ADMIN" ? "not-allowed" : undefined
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Speaking</label>
                  <input
                    type="text"
                    readOnly={user?.role === "ADMIN"}
                    placeholder="—"
                    value={formData.speaking}
                    onChange={(e) => handleSubScoreChange("speaking", e.target.value)}
                    className="form-input"
                    style={{
                      padding: "8px 10px",
                      textAlign: "center",
                      background: user?.role === "ADMIN" ? "var(--bg-card-subtle, rgba(255,255,255,0.04))" : undefined,
                      cursor: user?.role === "ADMIN" ? "not-allowed" : undefined
                    }}
                  />
                </div>
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
                <label className="form-label" style={{ fontSize: "12px" }}>
                  Hạn hiệu lực {formData.expiry_date ? "(Theo chuẩn khóa học)" : "(Vô thời hạn)"}
                </label>
                <input
                  type={formData.expiry_date ? "date" : "text"}
                  readOnly
                  value={formData.expiry_date || "Vô thời hạn (Vĩnh viễn)"}
                  className="form-input"
                  style={{ opacity: 0.85 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Địa chỉ ví MetaMask học viên</label>
              <input
                type="text"
                placeholder="0x... (Địa chỉ ví MetaMask học viên)"
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
                  {loading ? "Đang lưu vào MySQL..." : "Lưu Bản Nháp (Chờ Admin Ký On-Chain)"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-gold"
                  style={{ flex: 1, padding: "14px", fontSize: "15px" }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Đang đúc Smart Contract & Lưu MySQL...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Ký MetaMask & Cấp Bằng On-Chain
                    </>
                  )}
                </button>
                {selectedDraftCode && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleRejectDraft}
                    className="btn btn-outline"
                    style={{
                      padding: "14px 18px",
                      fontSize: "14px",
                      color: "var(--danger-text)",
                      borderColor: "rgba(239, 68, 68, 0.4)",
                      whiteSpace: "nowrap"
                    }}
                    title="Từ chối bản nháp và chuyển trả cho Khảo thí chỉnh sửa"
                  >
                    Từ Chối Nháp
                  </button>
                )}
              </div>
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

      {/* Confirmation & Pre-mint Review Modal (Admin Four-Eyes Check) */}
      {showConfirmModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "var(--bg-modal-backdrop)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 998,
          padding: "20px"
        }}>
          <div className="glass-panel" style={{
            maxWidth: "560px",
            width: "100%",
            padding: "28px 32px",
            background: "var(--bg-surface-elevated)",
            borderRadius: "16px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🛡️</span> Đối Soát Dữ Liệu Trước Khi Phát Hành On-Chain
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "18px" }}>
              Vui lòng kiểm tra kỹ lưỡng các thông số hồ sơ do Nhân viên Khảo thí lập trước khi kích hoạt giao dịch ký ví.
            </p>

            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "16px",
              fontSize: "13px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "18px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Mã chứng chỉ:</span>
                <strong style={{ color: "var(--primary)" }}>{formData.certificate_code}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Học viên:</span>
                <strong>{formData.student_name} ({formData.student_code})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Kỳ thi / Chứng chỉ:</span>
                <span style={{ color: "var(--accent-gold)", fontWeight: 600 }}>{formData.course_name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Điểm thành phần:</span>
                <span>L: {formData.listening} • R: {formData.reading} • W: {formData.writing} • S: {formData.speaking}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Điểm Overall:</span>
                <strong style={{ color: "var(--success-text)", fontSize: "15px" }}>{formData.score}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Ngày cấp & Hiệu lực:</span>
                <span>{formData.issue_date} (Hạn: {formData.expiry_date || "Vô thời hạn"})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)" }}>Địa chỉ ví nhận:</span>
                <code style={{ fontSize: "11px", color: "#38bdf8", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>
                  {formData.wallet_address}
                </code>
              </div>
            </div>

            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "12px",
              color: "#fca5a5",
              marginBottom: "20px"
            }}>
              ⚠️ <strong>Cảnh báo tính bất biến:</strong> Sau khi ký MetaMask, Soulbound Token (ERC-721) sẽ được phát hành vĩnh viễn trên sổ cái Blockchain và không thể chỉnh sửa điểm.
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-outline"
                style={{ padding: "10px 18px", fontSize: "13px" }}
              >
                Hủy Bỏ / Kiểm Tra Lại
              </button>
              <button
                type="button"
                onClick={executeMintOnChain}
                className="btn btn-gold"
                style={{ padding: "10px 22px", fontSize: "13px", fontWeight: 700 }}
              >
                Xác Nhận & Mở Ví Ký MetaMask
              </button>
            </div>
          </div>
        </div>
      )}

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
              Chứng chỉ <strong>{successCert.certificate_code}</strong> đã được ghi vĩnh viễn vào Smart Contract và cơ sở dữ liệu MySQL.
            </p>

            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "var(--radius-md)", fontSize: "12px", textAlign: "left", marginBottom: "24px" }}>
              <div><strong>Tx Hash:</strong> <span style={{ color: "var(--primary)" }}>{successCert.tx_hash}</span></div>
              <div style={{ marginTop: "4px" }}><strong>Token ID:</strong> <span style={{ color: "var(--accent-gold)" }}>#{successCert.token_id}</span></div>
              <div style={{ marginTop: "4px" }}><strong>IPFS CID:</strong> <span style={{ color: "var(--accent-gold)" }}>{successCert.ipfs_hash}</span></div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to={`/verify?code=${successCert.certificate_code}`} className="btn btn-primary">
                Xem Cổng Thẩm Định
              </Link>
              <button
                type="button"
                onClick={() => window.open(`http://localhost:5000/api/public/pdf/${successCert.certificate_code}`, "_blank")}
                className="btn btn-gold"
              >
                <Download size={15} /> Tải PDF Thật
              </button>
              <button
                type="button"
                onClick={() => { setSuccessCert(null); navigate("/admin/certificates"); }}
                className="btn btn-outline"
              >
                Về Danh Sách
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
