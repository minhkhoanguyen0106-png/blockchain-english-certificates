import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Award, FilePlus, ListFilter, Users, CheckCircle2, XCircle, Clock, ShieldAlert, ArrowUpRight, Wallet, Sparkles, Layers } from "lucide-react";
import { getAllCertificates, shortenAddress, connectMetaMask } from "../services/web3Service";
import { dashboardApi, certificateApi } from "../services/apiService";

export default function DashboardPage({ wallet, setWallet, user }) {
  const [certs, setCerts] = useState(() => getAllCertificates());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [statsRes, certsRes] = await Promise.allSettled([
          dashboardApi.getDashboardStats(),
          certificateApi.getCertificates({ limit: 6 })
        ]);

        if (!isMounted) return;

        if (statsRes.status === "fulfilled" && statsRes.value?.success) {
          setStats(statsRes.value.data);
        }

        if (certsRes.status === "fulfilled" && certsRes.value?.success && Array.isArray(certsRes.value.data)) {
          const mapped = certsRes.value.data.map(d => ({
            id: d.id,
            certificate_code: d.certificate_code,
            student_name: d.student_name,
            student_code: d.student_code,
            course_name: d.course_name,
            course_code: d.course_code,
            score: d.score_overall,
            issue_date: d.issue_date ? d.issue_date.slice(0, 10) : "",
            status: d.status
          }));
          setCerts(mapped);
        }
      } catch (err) {
        console.warn("Backend dashboard offline fallback:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalCount = stats ? stats.totalCertificates : certs.length;
  const issuedCount = stats ? Number(stats.issuedCount) : certs.filter(c => c.status === "ISSUED_ON_CHAIN").length;
  const revokedCount = stats ? Number(stats.revokedCount) : certs.filter(c => c.status === "REVOKED").length;
  const pendingCount = stats ? Number(stats.pendingCount) : certs.filter(c => c.status === "PENDING").length;

  return (
    <div>
      {/* Top Welcome Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>
            Bảng Điều Khiển <span className="text-gradient">Quản Trị</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Xin chào, <strong>{user?.full_name || "Quản trị viên"}</strong> • Thẩm quyền:{" "}
            <span className={`badge ${user?.role === "ADMIN" ? "badge-success" : "badge-warning"}`} style={{ fontSize: "11px", padding: "2px 8px" }}>
              {user?.role || "ADMIN"}
            </span>
          </p>
        </div>

        <div>
          <Link to="/admin/certificates/issue" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
            <FilePlus size={15} />
            {user?.role === "ADMIN" ? "Cấp Bằng Mới" : "Soạn Bản Nháp"}
          </Link>
        </div>
      </div>

      {/* 4 Overview Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "18px", marginBottom: "28px" }}>
        
        <Link to="/admin/certificates" className="glass-panel" style={{ padding: "22px", display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>TỔNG CHỨNG CHỈ</span>
            <Award size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)" }}>{totalCount}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Toàn bộ hồ sơ trên hệ thống MySQL</div>
        </Link>

        <Link to="/admin/certificates?status=ISSUED_ON_CHAIN" className="glass-panel" style={{ padding: "22px", display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--success-text)", fontWeight: 600 }}>ĐÃ ĐÚC ON-CHAIN</span>
            <CheckCircle2 size={18} color="var(--success-color)" />
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--success-text)" }}>{issuedCount}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Hợp lệ vĩnh viễn trên sổ cái</div>
        </Link>

        <Link to="/admin/certificates?status=REVOKED" className="glass-panel" style={{ padding: "22px", display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--danger-text)", fontWeight: 600 }}>ĐÃ THU HỒI (REVOKED)</span>
            <XCircle size={18} color="var(--danger-color)" />
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--danger-text)" }}>{revokedCount}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Ghi nhận hủy hiệu lực</div>
        </Link>

        <Link to="/admin/certificates?status=PENDING" className="glass-panel" style={{ padding: "22px", display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--warning-text)", fontWeight: 600 }}>BẢN NHÁP (DRAFT)</span>
            <Clock size={18} color="var(--warning-color)" />
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--warning-text)" }}>{pendingCount}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Chờ Quản trị viên ký on-chain</div>
        </Link>

      </div>

      {/* Recent Certificates Table Preview */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>Chứng Chỉ Gần Đây</h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Các hồ sơ cấp bằng hoặc dự thảo vừa được khởi tạo từ MySQL</p>
          </div>
          <Link to="/admin/certificates" style={{ color: "var(--primary)", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
            Xem toàn bộ danh sách <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th>MÃ BẰNG</th>
                <th>HỌC VIÊN</th>
                <th>KHÓA HỌC & ĐIỂM</th>
                <th>NGÀY CẤP</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {certs.slice(0, 5).map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: "var(--primary)" }}>{c.certificate_code}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.student_name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.student_code}</div>
                  </td>
                  <td>
                    <div>{c.course_name}</div>
                    <div style={{ fontSize: "12px", color: "var(--accent-gold)", fontWeight: 700 }}>{c.score}</div>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{c.issue_date}</td>
                  <td>
                    {c.status === "ISSUED_ON_CHAIN" && <span className="badge badge-success">On-Chain</span>}
                    {c.status === "REVOKED" && <span className="badge badge-danger">Revoked</span>}
                    {c.status === "PENDING" && <span className="badge badge-warning">Draft</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
