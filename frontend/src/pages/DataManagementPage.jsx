import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Users, BookOpen, Plus, Search, CheckCircle2, UserPlus, BookPlus, Trash2 } from "lucide-react";
import { INITIAL_STUDENTS, INITIAL_COURSES } from "../services/mockData";
import { shortenAddress } from "../services/web3Service";

const STORAGE_KEY_STUDENTS = "certchain_students";
const STORAGE_KEY_COURSES = "certchain_courses";

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState("STUDENTS"); // STUDENTS | COURSES
  
  // State for students
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  // State for courses
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COURSES);
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_code: `HV2026-0${Math.floor(200 + Math.random() * 800)}`,
    full_name: "",
    email: "",
    wallet_address: ""
  });

  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_code: "",
    course_name: ""
  });

  // Handle Add Student
  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!newStudent.full_name || !newStudent.email) {
      alert("Vui lòng điền đủ họ tên và email!");
      return;
    }
    const updated = [
      ...students,
      { id: Date.now(), ...newStudent }
    ];
    setStudents(updated);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
    setShowAddStudentModal(false);
    setNewStudent({
      student_code: `HV2026-0${Math.floor(200 + Math.random() * 800)}`,
      full_name: "",
      email: "",
      wallet_address: ""
    });
    alert("Thêm hồ sơ học viên mới thành công!");
  };

  // Handle Add Course
  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!newCourse.course_code || !newCourse.course_name) {
      alert("Vui lòng điền đủ mã và tên khóa học!");
      return;
    }
    const updated = [
      ...courses,
      { id: Date.now(), ...newCourse }
    ];
    setCourses(updated);
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(updated));
    setShowAddCourseModal(false);
    setNewCourse({ course_code: "", course_name: "" });
    alert("Thêm kỳ thi / khóa học mới thành công!");
  };

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCourses = courses.filter(c =>
    c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-primary)" }}>
            Quản Trị <span className="text-gradient">Học Viên & Khóa Học</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Hệ cơ sở dữ liệu định danh học viên và danh mục các kỳ thi khảo thí tiếng Anh (IELTS, TOEIC, VSTEP).
          </p>
        </div>

        <div>
          {activeTab === "STUDENTS" ? (
            <button onClick={() => setShowAddStudentModal(true)} className="btn btn-primary">
              <UserPlus size={16} /> Thêm Học Viên Mới
            </button>
          ) : (
            <button onClick={() => setShowAddCourseModal(true)} className="btn btn-gold">
              <BookPlus size={16} /> Thêm Khóa Học Mới
            </button>
          )}
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
          <div style={{ position: "relative", minWidth: "260px" }}>
            <input
              type="text"
              placeholder={activeTab === "STUDENTS" ? "Tìm theo tên, mã, email..." : "Tìm theo tên khóa học..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "38px" }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "14px" }} />
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
                  <th>EMAIL</th>
                  <th>ĐỊA CHỈ VÍ METAMASK</th>
                  <th style={{ textAlign: "right" }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      Không tìm thấy học viên nào phù hợp với từ khóa.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700, color: "var(--primary)" }}>{s.student_code}</td>
                      <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{s.email}</td>
                      <td style={{ fontSize: "12px", color: "var(--primary)" }}>
                        {s.wallet_address ? shortenAddress(s.wallet_address) : <span style={{ color: "var(--text-muted)" }}>Chưa liên kết ví</span>}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link to="/admin/certificates/issue" className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "12px" }}>
                          Cấp Bằng
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

      {/* Tab 2: Courses Table */}
      {activeTab === "COURSES" && (
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>MÃ KHÓA HỌC</th>
                  <th>TÊN KỲ THI / KHÓA HỌC</th>
                  <th>LOẠI CHỨNG CHỈ</th>
                  <th style={{ textAlign: "right" }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      Không tìm thấy khóa học nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, color: "var(--accent-gold)" }}>{c.course_code}</td>
                      <td style={{ fontWeight: 600 }}>{c.course_name}</td>
                      <td>
                        <span className="badge badge-info">Soulbound Token</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link to="/admin/certificates/issue" className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "12px" }}>
                          Cấp Bằng
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
          <div className="glass-panel" style={{ maxWidth: "480px", width: "100%", padding: "32px", background: "var(--bg-surface-elevated)" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "20px", color: "var(--text-primary)" }}>Thêm Hồ Sơ Học Viên Mới</h3>
            <form onSubmit={handleAddStudent}>
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
                <label className="form-label">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lê Thị Mai Anh"
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
                <label className="form-label">Địa chỉ ví MetaMask (Nếu có)</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newStudent.wallet_address}
                  onChange={(e) => setNewStudent({ ...newStudent, wallet_address: e.target.value })}
                  className="form-input"
                  style={{ fontSize: "12px" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setShowAddStudentModal(false)} className="btn btn-outline">Hủy Bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu Học Viên</button>
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
          <div className="glass-panel" style={{ maxWidth: "480px", width: "100%", padding: "32px", background: "var(--bg-surface-elevated)" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "20px", color: "var(--text-primary)" }}>Thêm Khóa Học / Kỳ Thi Mới</h3>
            <form onSubmit={handleAddCourse}>
              <div className="form-group">
                <label className="form-label">Mã khóa học / Kỳ thi</label>
                <input
                  type="text"
                  required
                  placeholder="VD: SAT-ENG hoặc DUOLINGO-120"
                  value={newCourse.course_code}
                  onChange={(e) => setNewCourse({ ...newCourse, course_code: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tên khóa học / Kỳ thi</label>
                <input
                  type="text"
                  required
                  placeholder="VD: SAT Digital English Master 1400+"
                  value={newCourse.course_name}
                  onChange={(e) => setNewCourse({ ...newCourse, course_name: e.target.value })}
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
