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
  const [isManualMode, setIsManualMode] = useState(false);

  const formatDateDisplay = (val) => {
    if (!val) return "—";
    const str = String(val).slice(0, 10);
    const parts = str.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return str;
  };

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
      issue_date: draft.issue_date ? String(draft.issue_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      expiry_date: draft.expiry_date ? String(draft.expiry_date).slice(0, 10) : "",
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
      let res;
      try {
        res = await certificateApi.rejectDraft(cert.id, reason);
      } catch (rejectErr) {
        if (rejectErr?.status === 404) {
          res = await certificateApi.deleteCertificate(cert.id);
        } else {
          throw rejectErr;
        }
      }
      if (res?.success) {
        alert(`Đã từ chối bản nháp ${selectedDraftCode} thành công.`);
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
      alert("Vui lòng chọn học viên từ danh sách hoặc nhập đầy đủ họ tên và mã học viên.");
      return;
    }

    if (!formData.wallet_address) {
      alert("Vui lòng nhập hoặc liên kết địa chỉ ví điện tử của học viên trước khi tiếp tục.");
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
        throw new Error("Hãy kết nối ví ký điện tử trước khi phát hành chứng chỉ.");
      }

      let activeWallet = wallet;
      if (!activeWallet?.signer) {
        activeWallet = await connectMetaMask();
      }
      if (!activeWallet?.signer) {
        throw new Error("Không lấy được chữ ký số của Quản trị viên. Hãy kết nối ví rồi thử lại.");
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
          {user?.role === "ADMIN" ? (
            <>Duyệt &amp; <span className="text-gradient">Cấp Phát Chứng Chỉ Số</span></>
          ) : (
            <>Soạn <span className="text-gradient">Hồ Sơ Nháp Chứng Chỉ</span></>
          )}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          {user?.role === "ADMIN"
            ? "Đối soát hồ sơ khảo thí, ký xác thực và phát hành chứng chỉ điện tử bất biến."
            : "Nhập điểm khảo thí và lập bản nháp chứng chỉ để trình Quản trị viên kiểm duyệt."}
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

            {/* CHẾ ĐỘ 1: DÀNH CHO ADMIN DUYỆT HỒ SƠ NHÁP (Mặc định khi là Admin và không ở chế độ thủ công) */}
            {user?.role === "ADMIN" && !isManualMode ? (
              <div>
                {/* 1. Bộ chọn duy nhất: Hồ sơ nháp chờ duyệt */}
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label className="form-label" style={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Chọn hồ sơ nháp chờ phê duyệt</span>
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
                </div>

                {/* 2. Thẻ tóm tắt thông tin đối soát gọn gàng (Khi đã chọn hồ sơ nháp) */}
                {formData.student_name ? (
                  <div style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "12px",
                    padding: "18px",
                    marginBottom: "18px",
                    boxShadow: "var(--shadow-sm)"
                  }}>
                    {/* Học viên */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <div>
                        <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>{formData.student_name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Mã HV: <strong style={{ color: "var(--text-primary)" }}>{formData.student_code}</strong>
                          {formData.email && <span> • {formData.email}</span>}
                        </div>
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: "11px" }}>Chờ phê duyệt</span>
                    </div>

                    {/* Khóa thi & Điểm */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", marginBottom: "14px" }}>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Kỳ thi / Khóa học</div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formData.course_name}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Điểm tổng (Overall)</div>
                        <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: "15px" }}>{formData.score}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Ngày cấp bằng</div>
                        <div style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{formatDateDisplay(formData.issue_date)}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Hạn hiệu lực</div>
                        <div style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{formData.expiry_date ? formatDateDisplay(formData.expiry_date) : "Vô thời hạn"}</div>
                      </div>
                    </div>

                    {/* Bảng điểm 4 kỹ năng */}
                    <div style={{
                      background: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-subtle)",
                      padding: "12px",
                      borderRadius: "10px",
                      marginBottom: "16px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Điểm 4 kỹ năng thành phần</span>
                        <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600 }}>🔒 Đã niêm phong</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", textAlign: "center" }}>
                        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "8px 4px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Listening</div>
                          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", marginTop: "2px" }}>{formData.listening || "—"}</div>
                        </div>
                        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "8px 4px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Reading</div>
                          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", marginTop: "2px" }}>{formData.reading || "—"}</div>
                        </div>
                        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "8px 4px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Writing</div>
                          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", marginTop: "2px" }}>{formData.writing || "—"}</div>
                        </div>
                        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "8px 4px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Speaking</div>
                          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", marginTop: "2px" }}>{formData.speaking || "—"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Địa chỉ ví nhận NFT */}
                    <div>
                      <label className="form-label" style={{ fontSize: "11px", marginBottom: "4px" }}>
                        Địa chỉ ví điện tử của học viên
                      </label>
                      <input
                        type="text"
                        value={formData.wallet_address}
                        onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                        className="form-input"
                        style={{ fontSize: "12px", fontFamily: "monospace" }}
                        placeholder="0x..."
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: "24px 16px",
                    textAlign: "center",
                    border: "1px dashed var(--border-subtle)",
                    borderRadius: "10px",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    marginBottom: "18px"
                  }}>
                    Vui lòng chọn một hồ sơ nháp đang chờ duyệt từ danh sách phía trên để đối soát và ký phê duyệt phát hành.
                  </div>
                )}

                {/* Nút hành động */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="submit"
                    disabled={loading || !formData.student_name}
                    className="btn btn-gold"
                    style={{ flex: 1, padding: "13px", fontSize: "14px" }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Đang xử lý phát hành chứng chỉ...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Ký Xác Thực & Cấp Bằng
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
                        padding: "13px 16px",
                        fontSize: "13px",
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

                {/* Nút chuyển chế độ thủ công */}
                <div style={{ textAlign: "center", marginTop: "14px" }}>
                  <button
                    type="button"
                    onClick={() => setIsManualMode(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    Hoặc tạo mới chứng chỉ thủ công
                  </button>
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ 2: DÀNH CHO CÁN BỘ KHẢO THÍ (STAFF) HOẶC ADMIN NHẬP THỦ CÔNG */
              <div>
                {user?.role === "ADMIN" && isManualMode && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span className="badge badge-info" style={{ fontSize: "11px" }}>Chế độ nhập mới thủ công</span>
                    <button
                      type="button"
                      onClick={() => setIsManualMode(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: "12px",
                        cursor: "pointer",
                        textDecoration: "underline"
                      }}
                    >
                      Quay lại duyệt hồ sơ nháp
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Chọn học viên từ danh sách</label>
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
                      placeholder="Nhập họ tên học viên..."
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
                    <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600 }}>
                      (Tự động tính)
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
                  />
                </div>

                {/* Sub-scores 4 skills */}
                <div style={{ marginBottom: "18px" }}>
                  <label className="form-label" style={{ fontSize: "12px", marginBottom: "8px", display: "block" }}>
                    Điểm số các kỹ năng thành phần
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Listening</label>
                      <input
                        type="text"
                        placeholder="—"
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
                        placeholder="—"
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
                        placeholder="—"
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
                        placeholder="—"
                        value={formData.speaking}
                        onChange={(e) => handleSubScoreChange("speaking", e.target.value)}
                        className="form-input"
                        style={{ padding: "8px 10px", textAlign: "center" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Ngày thi / hạn hiệu lực */}
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
                      Hạn hiệu lực
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
                  <label className="form-label">Địa chỉ ví điện tử học viên</label>
                  <input
                    type="text"
                    placeholder="0x... (Địa chỉ ví điện tử học viên)"
                    value={formData.wallet_address}
                    onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                    className="form-input"
                    style={{ fontSize: "12px" }}
                  />
                </div>

                {/* Nút lưu hoặc phát hành */}
                {user?.role === "STAFF" ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "14px", fontSize: "15px" }}
                  >
                    {loading ? "Đang lưu hệ thống..." : "Lưu Bản Nháp (Gửi Admin Duyệt)"}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !formData.student_name}
                    className="btn btn-gold"
                    style={{ width: "100%", padding: "14px", fontSize: "15px" }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Đang xử lý phát hành...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Ký Xác Thực & Cấp Bằng
                      </>
                    )}
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
              <span>🛡️</span> Đối Soát Dữ Liệu Trước Khi Ký Phát Hành
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "18px" }}>
              Vui lòng kiểm tra kỹ lưỡng các thông số hồ sơ do Nhân viên Khảo thí lập trước khi kích hoạt giao dịch ký số.
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
                <span>{formatDateDisplay(formData.issue_date)} (Hạn: {formData.expiry_date ? formatDateDisplay(formData.expiry_date) : "Vô thời hạn"})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)" }}>Địa chỉ ví định danh:</span>
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
              ⚠️ <strong>Lưu ý:</strong> Sau khi ký xác thực, chứng chỉ sẽ được cấp chính thức vào hệ thống và không thể chỉnh sửa điểm.
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
                Xác Nhận & Ký Phát Hành
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
              Phát Hành Chứng Chỉ Số Thành Công!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
              Chứng chỉ <strong>{successCert.certificate_code}</strong> đã được xác thực và lưu trữ thành công trên hệ thống.
            </p>

            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "var(--radius-md)", fontSize: "12px", textAlign: "left", marginBottom: "24px" }}>
              <div><strong>Mã giao dịch xác thực:</strong> <span style={{ color: "var(--primary)" }}>{successCert.tx_hash}</span></div>
              <div style={{ marginTop: "4px" }}><strong>Mã số bằng:</strong> <span style={{ color: "var(--accent-gold)" }}>#{successCert.token_id}</span></div>
              <div style={{ marginTop: "4px" }}><strong>Mã lưu trữ số:</strong> <span style={{ color: "var(--accent-gold)" }}>{successCert.ipfs_hash}</span></div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => { setSuccessCert(null); navigate("/admin/certificates"); }}
                className="btn btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <CheckCircle2 size={16} /> Về Danh Sách Chứng Chỉ
              </button>
              <button
                type="button"
                onClick={() => window.open(`http://localhost:5000/api/public/pdf/${successCert.certificate_code}`, "_blank")}
                className="btn btn-gold"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Download size={15} /> Tải PDF Thật
              </button>
              <a
                href={`/verify?code=${successCert.certificate_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <ExternalLink size={14} /> Mở Trang Tra Cứu (Tab Mới)
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
