import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, User, ArrowLeft, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [role, setRole] = useState("ADMIN");

  const handleSubmit = (e) => {
    e.preventDefault();
    const userData = {
      username,
      full_name: role === "ADMIN" ? "Nguyễn Văn Giám Đốc" : "Trần Thị Cán Bộ",
      role
    };
    setUser(userData);
    localStorage.setItem("certchain_user", JSON.stringify(userData));
    navigate("/admin/dashboard");
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "440px", padding: "40px 32px" }}>
        
        <div style={{ marginBottom: "20px" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "13px" }}>
            <ArrowLeft size={14} /> Về trang chủ
          </Link>
        </div>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
            boxShadow: "0 0 15px var(--primary-glow)"
          }}>
            <Lock size={24} color="#04121e" />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 800 }}>Cổng Quản Trị Trung Tâm</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Dành cho Giám đốc & Cán bộ khảo thí tiếng Anh
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Vai trò đăng nhập</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={`btn ${role === "ADMIN" ? "btn-primary" : "btn-outline"}`}
                style={{ fontSize: "13px" }}
              >
                Quản Trị Viên (Admin)
              </button>
              <button
                type="button"
                onClick={() => setRole("STAFF")}
                className={`btn ${role === "STAFF" ? "btn-primary" : "btn-outline"}`}
                style={{ fontSize: "13px" }}
              >
                Cán Bộ Khảo Thí
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
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

          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px", marginTop: "10px" }}>
            Đăng Nhập Quản Trị
          </button>
        </form>

        <div style={{ marginTop: "20px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
          💡 <strong>Demo tip:</strong> Bấm trực tiếp "Đăng Nhập Quản Trị" để vào Dashboard ngay không cần đổi mật khẩu.
        </div>

      </div>
    </div>
  );
}
