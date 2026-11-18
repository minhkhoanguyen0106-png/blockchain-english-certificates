import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, FilePlus, CheckCircle2, XCircle, Clock, ArrowUpRight, History } from "lucide-react";
import { getAllCertificates } from "../services/web3Service";
import { dashboardApi, certificateApi } from "../services/apiService";

export default function DashboardPage({ user }) {
  const navigate = useNavigate();
  const [certs, setCerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [statsRes, certsRes, logsRes] = await Promise.allSettled([
          dashboardApi.getDashboardStats(),
          certificateApi.getCertificates({ limit: 6 }),
          dashboardApi.getAuditLogs(6)
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
        } else {
          setCerts(getAllCertificates());
        }

        if (logsRes.status === "fulfilled" && logsRes.value?.success && Array.isArray(logsRes.value.data)) {
          setAuditLogs(logsRes.value.data);
        }
      } catch (err) {
        console.warn("Backend dashboard offline fallback:", err.message);
        if (isMounted) setCerts(getAllCertificates());
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
            Bảng Điều Khiển <span className="text-gradient">{user?.role === "ADMIN" ? "Quản Trị" : "Khảo Thí"}</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            {user?.role === "ADMIN"
              ? "Tổng quan số liệu cấp phát, phê duyệt và quản lý chứng chỉ trên hệ thống."
              : "Tổng quan hồ sơ khảo thí và tiến độ phê duyệt chứng chỉ của trung tâm."}
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
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Toàn bộ hồ sơ trên hệ thống</div>
        </Link>

        <Link to="/admin/certificates?status=ISSUED_ON_CHAIN" className="glass-panel" style={{ padding: "22px", display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--success-text)", fontWeight: 600 }}>ĐÃ PHÁT HÀNH</span>
            <CheckCircle2 size={18} color="var(--success-color)" />
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--success-text)" }}>{issuedCount}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Chứng chỉ số hợp lệ vĩnh viễn</div>
        </Link>

        <Link to="/admin/certificates?status=REVOKED" className="glass-panel" style={{ padding: "22px", display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--danger-text)", fontWeight: 600 }}>ĐÃ THU HỒI</span>
            <XCircle size={18} color="var(--danger-color)" />
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--danger-text)" }}>{revokedCount}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Đã ghi nhận hủy hiệu lực</div>
        </Link>

        <Link to="/admin/certificates?status=PENDING" className="glass-panel" style={{ padding: "22px", display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--warning-text)", fontWeight: 600 }}>CHỜ PHÊ DUYỆT</span>
            <Clock size={18} color="var(--warning-color)" />
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--warning-text)" }}>{pendingCount}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Hồ sơ đang chờ phê duyệt</div>
        </Link>

      </div>

      {/* Recent Certificates Table Preview */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>Chứng Chỉ Gần Đây</h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Các hồ sơ cấp bằng hoặc dự thảo vừa được khởi tạo</p>
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
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
                    Đang tải dữ liệu chứng chỉ...
                  </td>
                </tr>
              ) : certs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
                    Chưa có hồ sơ chứng chỉ nào trên hệ thống.
                  </td>
                </tr>
              ) : (
                certs.slice(0, 5).map(c => (
                  <tr
                    key={c.id}
                    onClick={() => navigate("/admin/certificates")}
                    style={{ cursor: "pointer" }}
                    title="Bấm để xem chi tiết tại Danh Sách Chứng Chỉ"
                  >
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
                      {c.status === "ISSUED_ON_CHAIN" && <span className="badge badge-success">Hợp Lệ</span>}
                      {c.status === "REVOKED" && <span className="badge badge-danger">Đã Thu Hồi</span>}
                      {c.status === "PENDING" && <span className="badge badge-warning">Chờ Duyệt</span>}
                      {c.status === "REJECTED" && <span className="badge badge-danger">Bị Từ Chối</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Timeline (Truy vết & Kiểm toán lịch sử thao tác) */}
      {auditLogs.length > 0 && (
        <div className="glass-panel" style={{ padding: "24px", marginTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <History size={18} color="var(--primary)" />
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>
              Nhật Ký Kiểm Toán Gần Đây
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "10px 14px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  flexWrap: "wrap"
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{log.action_detail || log.action}</span>
                  {log.note && (
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {log.note}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>
                  <div>{log.actor_name || log.username || "Hệ thống"}</div>
                  <div>{log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
