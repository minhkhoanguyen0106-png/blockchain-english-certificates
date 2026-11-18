import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CertificateVerifier from "../components/CertificateVerifier";

export default function VerifyPage() {
  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div className="container" style={{ maxWidth: "860px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "14px", fontWeight: 500 }}>
            <ArrowLeft size={16} /> Quay lại trang chủ
          </Link>
        </div>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)" }}>
            Tra Cứu &amp; Xác Thực <span className="text-gradient">Chứng Chỉ Số</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Kiểm tra tính toàn vẹn trực tiếp từ dữ liệu xác thực điện tử — Học viên &amp; Nhà tuyển dụng không cần đăng nhập.
          </p>
        </div>

        <CertificateVerifier syncUrl={true} />
      </div>
    </div>
  );
}
