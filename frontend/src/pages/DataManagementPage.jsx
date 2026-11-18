import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  Search,
  UserPlus,
  BookPlus,
  RefreshCw,
  Pencil,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";
import { ethers } from "ethers";
import { shortenAddress } from "../services/web3Service";
import { studentApi, courseApi } from "../services/apiService";
import { DEFAULT_MAX_SCORE_BY_TYPE } from "../services/scoreEngine";
import { toast } from "../components/ToastContainer";

const STORAGE_KEY_STUDENTS = "certchain_students";
const STORAGE_KEY_COURSES = "certchain_courses";

const generateStudentCode = () =>
  `HV${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

const createEmptyStudent = () => ({
  student_code: generateStudentCode(),
  citizen_id: "",
  full_name: "",
  email: "",
  date_of_birth: "",
  phone: "",
  wallet_address: ""
});

const createEmptyCourse = () => ({
  course_code: "",
  course_name: "",
  score_type: "IELTS",
  max_score: "9.0",
  duration: "3 tháng",
  description: ""
});

const formatDateVN = (val) => {
  if (!val) return "—";
  const str = String(val).slice(0, 10);
  const parts = str.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : str;
};

export default function DataManagementPage({ user }) {
  const [activeTab, setActiveTab] = useState("STUDENTS"); // STUDENTS | COURSES
  const canManageCourses = user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Student Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState(createEmptyStudent);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState(null);

  // Course Modal
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState(createEmptyCourse);

  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError("");
    try {
      const [stuRes, crsRes] = await Promise.allSettled([
        studentApi.getStudents(),
        courseApi.getCourses()
      ]);

      let failed = false;

      if (stuRes.status === "fulfilled" && stuRes.value?.success && Array.isArray(stuRes.value.data)) {
        setStudents(stuRes.value.data);
        try {
          localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(stuRes.value.data));
        } catch {}
      } else {
        failed = true;
      }

      if (crsRes.status === "fulfilled" && crsRes.value?.success && Array.isArray(crsRes.value.data)) {
        setCourses(crsRes.value.data);
        try {
          localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(crsRes.value.data));
        } catch {}
      } else {
        failed = true;
      }

      if (failed) {
        setApiError("Không thể đồng bộ đầy đủ dữ liệu từ máy chủ. Vui lòng kiểm tra kết nối Backend và thử lại.");
      }
    } catch {
      setApiError("Không thể kết nối máy chủ dữ liệu. Vui lòng kiểm tra Backend API và thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close open modals cleanly on Escape when not submitting
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape" || submitting) return;
      if (deleteStudentTarget) setDeleteStudentTarget(null);
      else if (editingStudent) setEditingStudent(null);
      else if (showAddStudentModal) setShowAddStudentModal(false);
      else if (showAddCourseModal) setShowAddCourseModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [submitting, deleteStudentTarget, editingStudent, showAddStudentModal, showAddCourseModal]);

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    setSearchTerm("");
  };

  const openAddStudentModal = () => {
    setNewStudent(createEmptyStudent());
    setShowAddStudentModal(true);
  };

  const openAddCourseModal = () => {
    setNewCourse(createEmptyCourse());
    setShowAddCourseModal(true);
  };

  const validateStudentPayload = (payload, { requireCode = false } = {}) => {
    if (requireCode) {
      const code = String(payload.student_code || "").trim().toUpperCase();
      if (!code || !/^[A-Z0-9_-]{2,20}$/.test(code)) {
        return "Mã học viên phải từ 2–20 ký tự (chỉ gồm chữ in hoa, số, dấu '-' hoặc '_').";
      }
    }

    const citizenId = String(payload.citizen_id || "").trim();
    if (!citizenId || !/^\d{9,12}$/.test(citizenId)) {
      return "Số CCCD/CMND là bắt buộc và phải gồm đúng 9 đến 12 chữ số!";
    }

    if (!payload.full_name?.trim()) {
      return "Vui lòng nhập họ và tên học viên!";
    }

    const email = String(payload.email || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Định dạng địa chỉ Email không hợp lệ!";
    }

    const dob = String(payload.date_of_birth || "").trim().slice(0, 10);
    if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return "Vui lòng chọn ngày sinh hợp lệ cho học viên!";
    }
    const dobMs = new Date(`${dob}T00:00:00`).getTime();
    if (Number.isNaN(dobMs) || dobMs > Date.now()) {
      return "Ngày sinh không được lớn hơn ngày hiện tại!";
    }

    const phone = String(payload.phone || "").trim();
    if (phone && !/^\+?\d{9,12}$/.test(phone.replace(/\s+/g, ""))) {
      return "Số điện thoại phải gồm 9 đến 12 chữ số (hoặc để trống).";
    }

    const wallet = String(payload.wallet_address || "").trim();
    if (wallet && !ethers.isAddress(wallet.toLowerCase())) {
      return "Địa chỉ ví điện tử không hợp lệ (cần địa chỉ Ethereum 42 ký tự bắt đầu bằng 0x).";
    }

    return null;
  };

  // Handle Add Student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const validationErr = validateStudentPayload(newStudent, { requireCode: true });
    if (validationErr) {
      toast.warning(validationErr);
      return;
    }

    const cleanWallet = String(newStudent.wallet_address || "").trim();
    const payload = {
      student_code: String(newStudent.student_code).trim().toUpperCase(),
      citizen_id: String(newStudent.citizen_id).trim(),
      full_name: newStudent.full_name.trim(),
      email: newStudent.email.trim(),
      date_of_birth: String(newStudent.date_of_birth).slice(0, 10),
      phone: String(newStudent.phone || "").trim().replace(/\s+/g, "") || null,
      wallet_address: cleanWallet ? ethers.getAddress(cleanWallet.toLowerCase()) : null
    };

    setSubmitting(true);
    try {
      await studentApi.createStudent(payload);
      toast.success(`Đã lưu hồ sơ học viên ${payload.full_name} (${payload.student_code}) thành công!`);
      setShowAddStudentModal(false);
      setNewStudent(createEmptyStudent());
      await loadData();
    } catch (err) {
      toast.error(`Không thể lưu học viên vào hệ thống: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Update Student
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent?.id || submitting) return;
    const validationErr = validateStudentPayload(editingStudent, { requireCode: false });
    if (validationErr) {
      toast.warning(validationErr);
      return;
    }

    const cleanWallet = String(editingStudent.wallet_address || "").trim();
    const payload = {
      full_name: editingStudent.full_name.trim(),
      email: editingStudent.email.trim(),
      citizen_id: String(editingStudent.citizen_id).trim(),
      phone: String(editingStudent.phone || "").trim().replace(/\s+/g, "") || null,
      date_of_birth: String(editingStudent.date_of_birth).slice(0, 10),
      wallet_address: cleanWallet ? ethers.getAddress(cleanWallet.toLowerCase()) : null
    };

    setSubmitting(true);
    try {
      await studentApi.updateStudent(editingStudent.id, payload);
      toast.success(`Đã cập nhật hồ sơ học viên ${payload.full_name}!`);
      setEditingStudent(null);
      await loadData();
    } catch (err) {
      toast.error(`Không thể cập nhật học viên: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Student (ADMIN only)
  const handleConfirmDeleteStudent = async () => {
    if (!deleteStudentTarget?.id || !isAdmin || submitting) return;
    setSubmitting(true);
    try {
      await studentApi.deleteStudent(deleteStudentTarget.id);
      toast.success(`Đã xóa học viên ${deleteStudentTarget.full_name} (${deleteStudentTarget.student_code})!`);
      setDeleteStudentTarget(null);
      await loadData();
    } catch (err) {
      const msg = String(err.message || err);
      if (msg.toLowerCase().includes("foreign key") || msg.includes("1451")) {
        toast.error("Không thể xóa học viên này vì đã có hồ sơ chứng chỉ gắn với học viên trong hệ thống.");
      } else {
        toast.error(`Không thể xóa học viên: ${msg}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Course
  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!canManageCourses) {
      toast.error("Chỉ Quản trị viên (ADMIN) mới có quyền thêm khóa học.");
      return;
    }
    const cleanCode = (newCourse.course_code || "").trim().toUpperCase().replace(/\s+/g, "-");
    const cleanName = (newCourse.course_name || "").trim();
    const maxScoreNum = parseFloat(newCourse.max_score);

    if (!cleanCode || !cleanName) {
      toast.warning("Vui lòng điền đủ mã và tên khóa học!");
      return;
    }
    if (!/^[A-Z0-9_-]{2,20}$/.test(cleanCode)) {
      toast.warning("Mã khóa học chỉ gồm chữ in hoa, số, dấu '-' hoặc '_' (tối đa 20 ký tự).");
      return;
    }
    if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
      toast.warning("Điểm tối đa phải là một số dương hợp lệ!");
      return;
    }

    const payload = {
      course_code: cleanCode,
      course_name: cleanName,
      score_type: newCourse.score_type || "IELTS",
      max_score: String(newCourse.max_score).trim(),
      duration: (newCourse.duration || "3 tháng").trim(),
      description: (newCourse.description || "").trim()
    };

    setSubmitting(true);
    try {
      await courseApi.createCourse(payload);
      toast.success(`Đã thêm khóa học ${cleanCode} (${payload.score_type} — tối đa ${payload.max_score}) thành công!`);
      setShowAddCourseModal(false);
      setNewCourse(createEmptyCourse());
      await loadData();
    } catch (err) {
      toast.error(`Không thể lưu khóa học: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const q = searchTerm.trim().toLowerCase();
  const filteredStudents = students.filter(
    (s) =>
      !q ||
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.student_code || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.citizen_id || "").toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q) ||
      (s.wallet_address || "").toLowerCase().includes(q)
  );

  const filteredCourses = courses.filter(
    (c) =>
      !q ||
      (c.course_name || "").toLowerCase().includes(q) ||
      (c.course_code || "").toLowerCase().includes(q) ||
      (c.score_type || "").toLowerCase().includes(q)
  );

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="admin-page admin-data">
      {/* Offline / API Error Banner */}
      {apiError && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 16px",
            borderRadius: "14px",
            background: "rgba(239, 68, 68, 0.09)",
            border: "1px solid rgba(239, 68, 68, 0.28)",
            color: "var(--danger-text)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px"
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
            <AlertTriangle size={16} />
            {apiError}
          </span>
          <button type="button" onClick={loadData} className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "12px" }}>
            Thử lại
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            {canManageCourses ? "Quản Trị Học Viên & Khóa Học" : "Quản Lý Học Viên & Kỳ Thi"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13.5px", marginTop: "3px" }}>
            {canManageCourses
              ? "Cơ sở dữ liệu định danh học viên và danh mục các kỳ thi khảo thí tiếng Anh."
              : "Quản lý hồ sơ định danh học viên và tra cứu danh mục các kỳ thi tiếng Anh."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button type="button" onClick={loadData} className="finnova-icon-circle" title="Làm mới dữ liệu">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          {activeTab === "STUDENTS" ? (
            <button type="button" onClick={openAddStudentModal} className="finnova-cta-pill">
              <UserPlus size={16} /> Thêm Học Viên Mới
            </button>
          ) : canManageCourses ? (
            <button type="button" onClick={openAddCourseModal} className="finnova-cta-pill">
              <BookPlus size={16} /> Thêm Khóa Học Mới
            </button>
          ) : null}
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="finnova-kpi-card" style={{ padding: "14px 18px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          {/* Segmented Pill Tabs */}
          <div className="finnova-notch-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "STUDENTS"}
              onClick={() => handleSwitchTab("STUDENTS")}
              className={`finnova-notch-tab ${activeTab === "STUDENTS" ? "is-active" : ""}`}
            >
              <Users size={15} />
              <span>Danh Sách Học Viên</span>
              <span className="finnova-notch-count">{students.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "COURSES"}
              onClick={() => handleSwitchTab("COURSES")}
              className={`finnova-notch-tab ${activeTab === "COURSES" ? "is-active" : ""}`}
            >
              <BookOpen size={15} />
              <span>Danh Mục Khóa Học</span>
              <span className="finnova-notch-count">{courses.length}</span>
            </button>
          </div>

          {/* Search */}
          <div style={{ position: "relative", width: "360px", maxWidth: "100%" }}>
            <input
              type="text"
              placeholder={
                activeTab === "STUDENTS"
                  ? "Tìm tên, mã HV, CCCD, SĐT, email hoặc ví..."
                  : "Tìm theo tên, mã hoặc chuẩn điểm khóa học..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "36px", paddingRight: searchTerm ? "32px" : "14px", height: "40px", width: "100%" }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "13px" }} />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Xóa từ khóa"
                style={{
                  position: "absolute",
                  right: "9px",
                  top: "10px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex"
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab 1: Students Table */}
      {activeTab === "STUDENTS" && (
        <div className="finnova-kpi-card" style={{ padding: "18px 20px" }}>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>MÃ HỌC VIÊN</th>
                  <th>HỌ VÀ TÊN</th>
                  <th>CCCD / NGÀY SINH</th>
                  <th>LIÊN HỆ</th>
                  <th>ĐỊA CHỈ VÍ ĐIỆN TỬ</th>
                  <th style={{ textAlign: "right" }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "44px 20px", color: "var(--text-muted)" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
                        <RefreshCw size={16} className="animate-spin" />
                        Đang tải danh sách học viên...
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "44px 20px", color: "var(--text-muted)" }}>
                      Chưa tìm thấy học viên nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700, color: "var(--primary)", fontFamily: "monospace", fontSize: "13px" }}>
                        {s.student_code}
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.full_name}</td>
                      <td>
                        <div style={{ color: "var(--text-primary)", fontFamily: "monospace", fontSize: "12.5px" }}>
                          {s.citizen_id || "—"}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                          NS: {formatDateVN(s.date_of_birth)}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{s.email}</div>
                        {s.phone && (
                          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                            SĐT: {s.phone}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "12px", fontFamily: "monospace" }}>
                        {s.wallet_address ? (
                          <span title={s.wallet_address}>{shortenAddress(s.wallet_address)}</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontFamily: "inherit" }}>Chưa liên kết</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "7px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingStudent({
                                ...s,
                                date_of_birth: s.date_of_birth ? String(s.date_of_birth).slice(0, 10) : "",
                                phone: s.phone || "",
                                wallet_address: s.wallet_address || ""
                              })
                            }
                            className="btn btn-outline"
                            style={{ padding: "6px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            title="Sửa thông tin hoặc gắn địa chỉ ví học viên"
                          >
                            <Pencil size={13} />
                            Sửa
                          </button>
                          <Link
                            to={`/admin/certificates/issue?student=${encodeURIComponent(s.student_code)}`}
                            className="btn btn-outline"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                          >
                            {canManageCourses ? "Cấp Bằng" : "Soạn Nháp"}
                          </Link>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeleteStudentTarget(s)}
                              className="btn btn-outline"
                              style={{
                                padding: "6px 9px",
                                fontSize: "12px",
                                color: "var(--danger-text)",
                                borderColor: "rgba(225, 29, 72, 0.35)"
                              }}
                              title="Xóa hồ sơ học viên (chỉ khi chưa có chứng chỉ)"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Courses Table */}
      {activeTab === "COURSES" && (
        <div className="finnova-kpi-card" style={{ padding: "18px 20px" }}>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>MÃ KHÓA HỌC</th>
                  <th>TÊN KHÓA HỌC / KỲ THI</th>
                  <th>CHUẨN ĐIỂM</th>
                  <th>THỜI LƯỢNG</th>
                  <th style={{ textAlign: "right" }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "44px 20px", color: "var(--text-muted)" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
                        <RefreshCw size={16} className="animate-spin" />
                        Đang tải danh mục khóa học...
                      </div>
                    </td>
                  </tr>
                ) : filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "44px 20px", color: "var(--text-muted)" }}>
                      Chưa tìm thấy khóa học nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, color: "#0369a1", fontFamily: "monospace", fontSize: "13px" }}>
                        {c.course_code}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.course_name}</div>
                        {c.description && (
                          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {c.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {c.score_type || "IELTS"} (Tối đa {c.max_score || "9.0"})
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{c.duration || "3 tháng"}</td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          to={`/admin/certificates/issue?course=${encodeURIComponent(c.course_code)}`}
                          className="btn btn-outline"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                          {canManageCourses ? "Cấp Bằng" : "Soạn Nháp"}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Student */}
      {showAddStudentModal && (
        <div
          onClick={() => { if (!submitting) setShowAddStudentModal(false); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-modal-backdrop)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{ maxWidth: "540px", width: "100%", padding: "28px 30px", background: "var(--bg-surface-elevated)", maxHeight: "92vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "19px", fontWeight: 800, color: "var(--text-primary)" }}>Thêm Hồ Sơ Học Viên Mới</h3>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowAddStudentModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddStudent}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Mã học viên</label>
                    <button
                      type="button"
                      onClick={() => setNewStudent((prev) => ({ ...prev, student_code: generateStudentCode() }))}
                      style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                    >
                      Tạo mã mới
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={newStudent.student_code}
                    onChange={(e) => setNewStudent({ ...newStudent, student_code: e.target.value.toUpperCase().replace(/\s+/g, "-") })}
                    className="form-input"
                    style={{ fontFamily: "monospace", fontWeight: 600 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số CCCD / CMND</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="Nhập 9–12 chữ số CCCD"
                    value={newStudent.citizen_id}
                    onChange={(e) => setNewStudent({ ...newStudent, citizen_id: e.target.value.replace(/\D/g, "") })}
                    className="form-input"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Họ và tên học viên</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lê Mai Anh"
                  value={newStudent.full_name}
                  onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Ngày sinh</label>
                  <input
                    type="date"
                    required
                    max={todayIso}
                    value={newStudent.date_of_birth}
                    onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại (tùy chọn)</label>
                  <input
                    type="tel"
                    maxLength={15}
                    placeholder="VD: 0901234567"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ Email</label>
                <input
                  type="email"
                  required
                  placeholder="VD: maianh.le@gmail.com"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ ví điện tử định danh (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="0x... (42 ký tự, có thể bổ sung sau)"
                  value={newStudent.wallet_address}
                  onChange={(e) => setNewStudent({ ...newStudent, wallet_address: e.target.value })}
                  className="form-input"
                  style={{ fontSize: "12px", fontFamily: "monospace" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "22px" }}>
                <button type="button" disabled={submitting} onClick={() => setShowAddStudentModal(false)} className="btn btn-outline">
                  Hủy Bỏ
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? "Đang lưu..." : "Lưu Hồ Sơ Học Viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Student */}
      {editingStudent && (
        <div
          onClick={() => { if (!submitting) setEditingStudent(null); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-modal-backdrop)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{ maxWidth: "540px", width: "100%", padding: "28px 30px", background: "var(--bg-surface-elevated)", maxHeight: "92vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <h3 style={{ fontSize: "19px", fontWeight: 800, color: "var(--text-primary)" }}>
                  Cập Nhật Hồ Sơ Học Viên
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                  Mã học viên: <strong style={{ color: "var(--primary)", fontFamily: "monospace" }}>{editingStudent.student_code}</strong>
                </p>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setEditingStudent(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent}>
              <div className="form-group">
                <label className="form-label">Họ và tên học viên</label>
                <input
                  type="text"
                  required
                  value={editingStudent.full_name || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Số CCCD / CMND</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={editingStudent.citizen_id || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, citizen_id: e.target.value.replace(/\D/g, "") })}
                    className="form-input"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày sinh</label>
                  <input
                    type="date"
                    required
                    max={todayIso}
                    value={editingStudent.date_of_birth || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, date_of_birth: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    required
                    value={editingStudent.email || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="tel"
                    maxLength={15}
                    placeholder="VD: 0901234567"
                    value={editingStudent.phone || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ ví điện tử định danh (0x...)</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={editingStudent.wallet_address || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, wallet_address: e.target.value })}
                  className="form-input"
                  style={{ fontSize: "12px", fontFamily: "monospace" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "22px" }}>
                <button type="button" disabled={submitting} onClick={() => setEditingStudent(null)} className="btn btn-outline">
                  Hủy Bỏ
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Student (ADMIN) */}
      {deleteStudentTarget && (
        <div
          onClick={() => { if (!submitting) setDeleteStudentTarget(null); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-modal-backdrop)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{ maxWidth: "450px", width: "100%", padding: "28px", background: "var(--bg-surface-elevated)", borderColor: "rgba(225, 29, 72, 0.3)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", color: "var(--danger-text)" }}>
              <Trash2 size={21} />
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>Xác Nhận Xóa Học Viên</h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: 1.55, marginBottom: "20px" }}>
              Bạn có chắc chắn muốn xóa hồ sơ học viên <strong>{deleteStudentTarget.full_name}</strong> ({deleteStudentTarget.student_code})? Lưu ý: học viên đã có chứng chỉ trong hệ thống sẽ không thể xóa để bảo toàn lịch sử kiểm toán.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" disabled={submitting} onClick={() => setDeleteStudentTarget(null)} className="btn btn-outline">
                Hủy Bỏ
              </button>
              <button type="button" disabled={submitting} onClick={handleConfirmDeleteStudent} className="btn btn-danger">
                {submitting ? "Đang xóa..." : "Xác Nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Course */}
      {showAddCourseModal && (
        <div
          onClick={() => { if (!submitting) setShowAddCourseModal(false); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-modal-backdrop)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{ maxWidth: "520px", width: "100%", padding: "28px 30px", background: "var(--bg-surface-elevated)", maxHeight: "92vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <h3 style={{ fontSize: "19px", fontWeight: 800, color: "var(--text-primary)" }}>Thêm Khóa Học / Kỳ Thi Mới</h3>
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "3px" }}>
                  Cấu hình chuẩn thang điểm để hệ thống tự động tính điểm tổng và hạn hiệu lực khi cấp bằng.
                </p>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowAddCourseModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCourse}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Mã khóa học / Kỳ thi</label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="VD: IELTS-GEN, VSTEP-B2"
                    value={newCourse.course_code}
                    onChange={(e) => setNewCourse({ ...newCourse, course_code: e.target.value.toUpperCase() })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Chuẩn thang điểm</label>
                  <select
                    value={newCourse.score_type}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setNewCourse({
                        ...newCourse,
                        score_type: nextType,
                        max_score: DEFAULT_MAX_SCORE_BY_TYPE[nextType] || "100"
                      });
                    }}
                    className="form-select"
                  >
                    <option value="IELTS">IELTS (0.0 – 9.0)</option>
                    <option value="TOEIC">TOEIC (10 – 990)</option>
                    <option value="VSTEP">VSTEP (0 – 10.0 / B1-C1)</option>
                    <option value="CAMBRIDGE">Cambridge Scale (80 – 230)</option>
                    <option value="GENERAL">Tổng quát (Tự định thang điểm)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tên khóa học / Kỳ thi</label>
                <input
                  type="text"
                  required
                  placeholder="VD: IELTS General Training hoặc VSTEP B2 Chuẩn Đầu Ra"
                  value={newCourse.course_name}
                  onChange={(e) => setNewCourse({ ...newCourse, course_name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Điểm tối đa</label>
                  <input
                    type="text"
                    required
                    readOnly={newCourse.score_type !== "GENERAL"}
                    value={newCourse.max_score}
                    onChange={(e) => setNewCourse({ ...newCourse, max_score: e.target.value })}
                    className="form-input"
                    style={newCourse.score_type !== "GENERAL" ? { opacity: 0.75, cursor: "not-allowed" } : {}}
                    placeholder="VD: 100"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Thời lượng đào tạo</label>
                  <input
                    type="text"
                    placeholder="VD: 3 tháng"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả ngắn (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="VD: Chương trình luyện thi chuẩn đầu ra tiếng Anh bậc 4"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "22px" }}>
                <button type="button" disabled={submitting} onClick={() => setShowAddCourseModal(false)} className="btn btn-outline">
                  Hủy Bỏ
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? "Đang lưu..." : "Lưu Khóa Học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
