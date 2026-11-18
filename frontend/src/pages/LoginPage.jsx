import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, User, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { authApi } from "../services/apiService";

export default function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await authApi.login(username, password);
      if (!result?.user?.role) throw new Error("Máy chủ không trả về thông tin tài khoản hợp lệ.");

      const userData = {
        id: result.user.id,
        username: result.user.username,
        full_name: result.user.fullName || result.user.full_name,
        email: result.user.email,
        role: result.user.role
      };
      setUser(userData);
      localStorage.setItem("certchain_user", JSON.stringify(userData));

      if (["ADMIN", "STAFF"].includes(userData.role)) {
        navigate("/admin/dashboard");
      } else {
        authApi.logout();
        setUser(null);
        setErrorMessage("Cổng đăng nhập chỉ dành cho Quản trị viên và Cán bộ Khảo thí. Học viên vui lòng tra cứu trực tiếp tại Cổng Tra Cứu Công Khai.");
      }
    } catch (err) {
      authApi.logout();
      setUser(null);
      setErrorMessage(err.message || "Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "480px", padding: "36px 32px" }}>
        
        <div style={{ marginBottom: "20px" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "13px", fontWeight: 500 }}>
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
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>Đăng Nhập Nội Bộ</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Dành riêng cho Quản trị viên và Cán bộ Khảo thí của Trung tâm.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Nhập tên đăng nhập..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "38px" }}
              />
              <User size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "14px" }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "22px" }}>
            <label className="form-label">Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "38px" }}
              />
              <Lock size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "14px" }} />
            </div>
          </div>

          {errorMessage && (
            <div role="alert" style={{ background: "var(--danger-bg)", color: "var(--danger-text)", padding: "12px 14px", borderRadius: "var(--radius-sm)", marginBottom: "16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "13px", fontSize: "15px" }}>
            {loading ? "Đang xác thực..." : "Đăng Nhập"}
          </button>

          <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)", textAlign: "center", fontSize: "12px", color: "var(--text-secondary)" }}>
            Bạn là <strong>Học viên</strong> hoặc <strong>Nhà tuyển dụng</strong>? Không cần đăng nhập.{" "}
            <Link to="/verify" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Tra cứu &amp; Xem ví bằng cấp ngay →
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
}
