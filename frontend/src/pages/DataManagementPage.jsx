import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, BookOpen, Search, UserPlus, BookPlus, RefreshCw, Pencil } from "lucide-react";
import { ethers } from "ethers";
import { INITIAL_STUDENTS, INITIAL_COURSES } from "../services/mockData";
import { shortenAddress } from "../services/web3Service";
import { studentApi, courseApi } from "../services/apiService";
import { DEFAULT_MAX_SCORE_BY_TYPE } from "../services/scoreEngine";
import { toast } from "../components/ToastContainer";

const STORAGE_KEY_STUDENTS = "certchain_students";
const STORAGE_KEY_COURSES = "certchain_courses";

export default function DataManagementPage({ user }) {
  const [activeTab, setActiveTab] = useState("STUDENTS"); // STUDENTS | COURSES
  const canManageCourses = user?.role === "ADMIN";
  
  // Khởi tạo mảng rỗng tránh nhấp nháy mock data (chỉ fallback khi offline)
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newStudent, setNewStudent] = useState({
    student_code: `HV2026-0${Math.floor(200 + Math.random() * 800)}`,
    citizen_id: `0792040${Math.floor(10000 + Math.random() * 90000)}`,
    full_name: "",
    email: "",
    date_of_birth: "2003-05-15",
    phone: "0901234567",
    wallet_address: ""
  });

  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_code: "",
    course_name: "",
    score_type: "IELTS",
    max_score: "9.0",
    duration: "3 tháng",
    description: ""
  });

  // Load from backend
  const loadData = async () => {
    setLoading(true);
    try {
      const [stuRes, crsRes] = await Promise.allSettled([
        studentApi.getStudents(),
        courseApi.getCourses()
      ]);

      if (stuRes.status === "fulfilled" && stuRes.value?.success && Array.isArray(stuRes.value.data)) {
        setStudents(stuRes.value.data);
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(stuRes.value.data));
      } else {
        const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
        setStudents(saved ? JSON.parse(saved) : INITIAL_STUDENTS);
      }

      if (crsRes.status === "fulfilled" && crsRes.value?.success && Array.isArray(crsRes.value.data)) {
        setCourses(crsRes.value.data);
        localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(crsRes.value.data));
      } else {
        const saved = localStorage.getItem(STORAGE_KEY_COURSES);
        setCourses(saved ? JSON.parse(saved) : INITIAL_COURSES);
      }
    } catch {
      const savedS = localStorage.getItem(STORAGE_KEY_STUDENTS);
      const savedC = localStorage.getItem(STORAGE_KEY_COURSES);
      setStudents(savedS ? JSON.parse(savedS) : INITIAL_STUDENTS);
      setCourses(savedC ? JSON.parse(savedC) : INITIAL_COURSES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateStudentPayload = (payload) => {
    if (!payload.full_name?.trim() || !payload.email?.trim()) {
      return "Vui lòng điền đầy đủ họ tên và địa chỉ email!";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
      return "Định dạng địa chỉ Email không hợp lệ!";
    }
    if (payload.citizen_id && !/^\d{9,12}$/.test(String(payload.citizen_id).trim())) {
      return "Số CCCD/CMND phải gồm từ 9 đến 12 chữ số!";
    }
    if (payload.wallet_address && payload.wallet_address.trim() !== "") {
      if (!ethers.isAddress(payload.wallet_address.trim().toLowerCase())) {
        return "Địa chỉ ví điện tử không hợp lệ (cần địa chỉ Ethereum 42 ký tự bắt đầu bằng 0x).";
      }
    }
    return null;
  };

  // Handle Add Student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    const validationErr = validateStudentPayload(newStudent);
    if (validationErr) {
      toast.warning(validationErr);
      return;
    }

    const payload = {
      ...newStudent,
      wallet_address: newStudent.wallet_address?.trim()
        ? ethers.getAddress(newStudent.wallet_address.trim().toLowerCase())
        : ""
    };

    try {
      await studentApi.createStudent(payload);
      toast.success("Đã lưu hồ sơ học viên thành công!");
      await loadData();
    } catch (err) {
      toast.error(`Không thể lưu học viên vào hệ thống: ${err.message || err}`);
      return;
    }

    setShowAddStudentModal(false);
    setNewStudent({
      student_code: `HV2026-0${Math.floor(200 + Math.random() * 800)}`,
      citizen_id: `0792040${Math.floor(10000 + Math.random() * 90000)}`,
      full_name: "",
      email: "",
      date_of_birth: "2003-05-15",
      phone: "0901234567",
      wallet_address: ""
    });
  };

  // Handle Update Student (Cập nhật thông tin & gắn ví Ethereum)
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent?.id) return;
    const validationErr = validateStudentPayload(editingStudent);
    if (validationErr) {
      toast.warning(validationErr);
      return;
    }

    const payload = {
      full_name: editingStudent.full_name.trim(),
      email: editingStudent.email.trim(),
      citizen_id: String(editingStudent.citizen_id || "").trim(),
      phone: editingStudent.phone || "",
      date_of_birth: editingStudent.date_of_birth ? String(editingStudent.date_of_birth).slice(0, 10) : "2003-05-15",
      wallet_address: editingStudent.wallet_address?.trim()
        ? ethers.getAddress(editingStudent.wallet_address.trim().toLowerCase())
        : null
    };

    try {
      await studentApi.updateStudent(editingStudent.id, payload);
      toast.success(`Đã cập nhật hồ sơ học viên ${payload.full_name}!`);
      setEditingStudent(null);
      await loadData();
    } catch (err) {
      toast.error(`Không thể cập nhật học viên: ${err.message || err}`);
    }
  };

  // Handle Add Course
  const handleAddCourse = async (e) => {
    e.preventDefault();
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

    try {
      await courseApi.createCourse(payload);
      toast.success(`Đã thêm khóa học ${cleanCode} (${payload.score_type} — tối đa ${payload.max_score}) thành công!`);
      await loadData();
    } catch (err) {
      toast.error(`Không thể lưu khóa học: ${err.message || err}`);
      return;
    }

    setShowAddCourseModal(false);
    setNewCourse({
      course_code: "",
      course_name: "",
      score_type: "IELTS",
      max_score: "9.0",
      duration: "3 tháng",
      description: ""
    });
  };

  const filteredStudents = students.filter(s =>
    (s.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.student_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.citizen_id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCourses = courses.filter(c =>
    (c.course_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.course_code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page admin-data">
      {/* Page Header */}
      <div className="admin-page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-primary)" }}>
            {canManageCourses ? (
              <>Quản Trị <span className="text-gradient">Học Viên &amp; Khóa Học</span></>
            ) : (
              <>Quản Lý <span className="text-gradient">Học Viên &amp; Kỳ Thi</span></>
            )}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            {canManageCourses
              ? "Cơ sở dữ liệu định danh học viên và danh mục các kỳ thi khảo thí tiếng Anh."
              : "Quản lý hồ sơ định danh học viên và tra cứu danh mục các kỳ thi tiếng Anh."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" onClick={loadData} className="btn btn-outline" title="Làm mới dữ liệu">
            <RefreshCw size={15} />
          </button>
          {activeTab === "STUDENTS" ? (
            <button onClick={() => setShowAddStudentModal(true)} className="btn btn-primary">
              <UserPlus size={16} /> Thêm Học Viên Mới
            </button>
          ) : canManageCourses ? (
            <button onClick={() => setShowAddCourseModal(true)} className="btn btn-gold">
              <BookPlus size={16} /> Thêm Khóa Học Mới
            </button>
          ) : null}
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="glass-panel" style={{ padding: "16px 20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          
          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("STUDENTS")}
              className={`btn ${activeTab === "STUDENTS" ? "btn-primary" : "btn-outline"}`}
              style={{ fontSize: "13px" }}
            >
              <Users size={16} /> Danh Sách Học Viên ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("COURSES")}
              className={`btn ${activeTab === "COURSES" ? "btn-primary" : "btn-outline"}`}
              style={{ fontSize: "13px" }}
            >
              <BookOpen size={16} /> Danh Mục Khóa Học ({courses.length})
            </button>
          </div>

          {/* Search */}
          <div style={{ position: "relative", width: "340px", maxWidth: "100%" }}>
            <input
              type="text"
              placeholder={activeTab === "STUDENTS" ? "Tìm tên, mã HV, email, CCCD..." : "Tìm theo tên hoặc mã khóa học..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "36px", paddingRight: "14px", height: "40px", width: "100%" }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "13px" }} />
          </div>

        </div>
      </div>

      {/* Tab 1: Students Table */}
      {activeTab === "STUDENTS" && (
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>MÃ HỌC VIÊN</th>
                  <th>HỌ VÀ TÊN</th>
                  <th>SỐ CCCD / ĐỊNH DANH</th>
                  <th>EMAIL</th>
                  <th>ĐỊA CHỈ VÍ ĐIỆN TỬ</th>
                  <th style={{ textAlign: "right" }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                      Chưa tìm thấy học viên nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700, color: "var(--primary)" }}>{s.student_code}</td>
                      <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                      <td style={{ color: "var(--text-secondary)", fontFamily: "monospace" }}>{s.citizen_id || "N/A"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{s.email}</td>
                      <td style={{ fontSize: "12px", fontFamily: "monospace" }}>
                        {s.wallet_address ? shortenAddress(s.wallet_address) : <span style={{ color: "var(--text-muted)" }}>Chưa liên kết</span>}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setEditingStudent({ ...s, wallet_address: s.wallet_address || "" })}
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
        <div className="glass-panel" style={{ padding: "20px" }}>
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
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                      Chưa tìm thấy khóa học nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, color: "var(--accent-gold)" }}>{c.course_code}</td>
                      <td style={{ fontWeight: 600 }}>{c.course_name}</td>
                      <td>
                        <span className="badge badge-success">{c.score_type || "IELTS"} (Tối đa {c.max_score || "9.0"})</span>
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
          <div className="glass-panel" style={{ maxWidth: "500px", width: "100%", padding: "32px", background: "var(--bg-surface-elevated)" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "20px", color: "var(--text-primary)" }}>Thêm Hồ Sơ Học Viên Mới</h3>
            <form onSubmit={handleAddStudent}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Mã học viên</label>
                  <input
                    type="text"
                    required
                    value={newStudent.student_code}
                    onChange={(e) => setNewStudent({ ...newStudent, student_code: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số CCCD</label>
                  <input
                    type="text"
                    required
                    value={newStudent.citizen_id}
                    onChange={(e) => setNewStudent({ ...newStudent, citizen_id: e.target.value })}
                    className="form-input"
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
                <label className="form-label">Địa chỉ ví điện tử định danh học viên</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newStudent.wallet_address}
                  onChange={(e) => setNewStudent({ ...newStudent, wallet_address: e.target.value })}
                  className="form-input"
                  style={{ fontSize: "12px", fontFamily: "monospace" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setShowAddStudentModal(false)} className="btn btn-outline">Hủy Bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu Hồ Sơ Học Viên</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Student */}
      {editingStudent && (
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
          <div className="glass-panel" style={{ maxWidth: "500px", width: "100%", padding: "32px", background: "var(--bg-surface-elevated)" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "6px", color: "var(--text-primary)" }}>
              Cập Nhật Hồ Sơ Học Viên
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
              Mã học viên: <strong style={{ color: "var(--primary)" }}>{editingStudent.student_code}</strong>
            </p>
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
                  <label className="form-label">Số CCCD</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.citizen_id || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, citizen_id: e.target.value })}
                    className="form-input"
                  />
                </div>
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
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ ví điện tử định danh học viên (0x...)</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={editingStudent.wallet_address || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, wallet_address: e.target.value })}
                  className="form-input"
                  style={{ fontSize: "12px", fontFamily: "monospace" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setEditingStudent(null)} className="btn btn-outline">Hủy Bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu Thay Đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Course */}
      {showAddCourseModal && (
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
          <div className="glass-panel" style={{ maxWidth: "520px", width: "100%", padding: "32px", background: "var(--bg-surface-elevated)" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "6px", color: "var(--text-primary)" }}>Thêm Khóa Học / Kỳ Thi Mới</h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "20px" }}>
              Cấu hình chuẩn thang điểm để hệ thống tự động tính điểm tổng và hạn hiệu lực khi cấp bằng.
            </p>
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setShowAddCourseModal(false)} className="btn btn-outline">Hủy Bỏ</button>
                <button type="submit" className="btn btn-gold">Lưu Khóa Học</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
