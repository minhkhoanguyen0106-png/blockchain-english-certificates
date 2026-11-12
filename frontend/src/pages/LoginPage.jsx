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

      if (userData.role === "STUDENT") {
        navigate("/verify");
      } else if (["ADMIN", "STAFF"].includes(userData.role)) {
        navigate("/admin/dashboard");
      } else {
        authApi.logout();
        setUser(null);
        setErrorMessage("Vai trò tài khoản không được hỗ trợ.");
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
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>Đăng Nhập Hệ Thống</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Vai trò được xác định từ tài khoản đã được cấp bởi hệ thống.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          
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

          {errorMessage && (
            <div role="alert" style={{ background: "var(--danger-bg)", color: "var(--danger-text)", padding: "12px 14px", borderRadius: "var(--radius-sm)", marginBottom: "16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            padding: "12px 14px",
            fontSize: "12px",
            color: "var(--text-secondary)",
            marginBottom: "20px"
          }}>
            <span style={{ color: "var(--text-secondary)" }}>
              Sau khi xác thực, hệ thống sẽ mở các chức năng tương ứng với quyền của tài khoản.
            </span>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "13px", fontSize: "15px" }}>
            {loading ? "Đang xác thực..." : "Xác Nhận Đăng Nhập"}
          </button>
        </form>

      </div>
    </div>
  );
}
