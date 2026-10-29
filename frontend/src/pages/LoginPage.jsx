import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, User, ArrowLeft, ShieldCheck, GraduationCap, Briefcase, AlertCircle } from "lucide-react";

export default function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const [role, setRole] = useState("ADMIN"); // ADMIN | STAFF | STUDENT
  const [username, setUsername] = useState("admin_khoa");
  const [password, setPassword] = useState("123456");

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === "ADMIN") {
      setUsername("admin_khoa");
    } else if (selectedRole === "STAFF") {
      setUsername("staff_long");
    } else {
      setUsername("student_yen");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let fullName = "Nguyễn Thị Minh Khoa (Giám Đốc Trung Tâm)";
    if (role === "STAFF") fullName = "Trần Bảo Long (Cán Bộ Khảo Thí)";
    if (role === "STUDENT") fullName = "Lê Hoàng Yến (Học Viên IELTS)";

    const userData = {
      username,
      full_name: fullName,
      role
    };

    setUser(userData);
    localStorage.setItem("certchain_user", JSON.stringify(userData));

    // Phân quyền điều hướng theo role:
    if (role === "STUDENT") {
      navigate("/verify?code=CERT-IELTS-2026-001");
    } else {
      navigate("/admin/dashboard");
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "480px", padding: "40px 32px" }}>
        
        <div style={{ marginBottom: "20px" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "13px" }}>
            <ArrowLeft size={14} /> Về trang chủ
          </Link>
        </div>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
            boxShadow: "0 0 15px var(--primary-glow)"
          }}>
            <ShieldCheck size={28} color="#04121e" />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 800 }}>Đăng Nhập Phân Quyền Hệ Thống</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Hỗ trợ kiểm tra ma trận phân quyền 3 cấp độ thực tế
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* 3 Role Selection Tabs */}
          <div className="form-group">
            <label className="form-label">Chọn vai trò muốn đăng nhập thử nghiệm:</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              <button
                type="button"
                onClick={() => handleRoleChange("ADMIN")}
                className={`btn ${role === "ADMIN" ? "btn-primary" : "btn-outline"}`}
                style={{ fontSize: "11px", padding: "8px 4px", flexDirection: "column", gap: "4px" }}
              >
                <ShieldCheck size={16} />
                <strong>ADMIN</strong>
                <span style={{ fontSize: "9px", opacity: 0.8 }}>Toàn quyền & Ký</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange("STAFF")}
                className={`btn ${role === "STAFF" ? "btn-primary" : "btn-outline"}`}
                style={{ fontSize: "11px", padding: "8px 4px", flexDirection: "column", gap: "4px" }}
              >
                <Briefcase size={16} />
                <strong>STAFF</strong>
                <span style={{ fontSize: "9px", opacity: 0.8 }}>Chỉ soạn nháp</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange("STUDENT")}
                className={`btn ${role === "STUDENT" ? "btn-primary" : "btn-outline"}`}
                style={{ fontSize: "11px", padding: "8px 4px", flexDirection: "column", gap: "4px" }}
              >
                <GraduationCap size={16} />
                <strong>STUDENT</strong>
                <span style={{ fontSize: "9px", opacity: 0.8 }}>Chỉ xem bằng</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tài khoản</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "38px" }}
              />
              <User size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "14px" }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "38px" }}
              />
              <Lock size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "14px" }} />
            </div>
          </div>

          {/* Role Permission Alert Note */}
          <div style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-light)",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "12px",
            color: "var(--text-secondary)",
            marginBottom: "20px"
          }}>
            {role === "ADMIN" && (
              <span style={{ color: "#38bdf8" }}>
                🛡️ <strong>Admin:</strong> Có quyền truy cập mọi trang quản trị, ký đúc Soulbound Token on-chain và ký thu hồi bằng (Revoke).
              </span>
            )}
            {role === "STAFF" && (
              <span style={{ color: "#fbbf24" }}>
                💼 <strong>Staff:</strong> Có quyền quản lý hồ sơ và soạn thảo bản nháp (Draft). <em>Bị khóa nút Ký đúc On-Chain và Thu hồi bằng</em>.
              </span>
            )}
            {role === "STUDENT" && (
              <span style={{ color: "#f87171" }}>
                🎓 <strong>Student:</strong> <em>Bị chặn 100% không thể vào các trang Quản trị</em> (sẽ bị lỗi 403 Forbidden nếu cố tình truy cập URL).
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px", fontSize: "15px" }}>
            Xác Nhận Đăng Nhập
          </button>
        </form>

      </div>
    </div>
  );
}
