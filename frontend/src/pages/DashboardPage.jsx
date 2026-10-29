import React from "react";
import { Link } from "react-router-dom";
import { Award, FilePlus, ListFilter, Users, CheckCircle2, XCircle, Clock, ShieldAlert, ArrowUpRight, Wallet } from "lucide-react";
import { getAllCertificates, shortenAddress, connectMetaMask } from "../services/web3Service";

export default function DashboardPage({ wallet, setWallet, user }) {
  const certs = getAllCertificates();
  const issuedCount = certs.filter(c => c.status === "ISSUED_ON_CHAIN").length;
  const revokedCount = certs.filter(c => c.status === "REVOKED").length;
  const pendingCount = certs.filter(c => c.status === "PENDING").length;

  return (
    <div style={{ padding: "36px 0 80px" }}>
      <div className="container">
        
        {/* Top welcome banner */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800 }}>
              Bảng Điều Khiển <span className="text-gradient">Quản Trị</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Xin chào, <strong>{user?.full_name || "Quản trị viên"}</strong> (Quyền hạn: <span className="badge badge-info">{user?.role || "ADMIN"}</span>)
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link to="/admin/certificates/issue" className="btn btn-primary">
              <FilePlus size={16} />
              Cấp Bằng Mới
            </Link>
            <Link to="/admin/certificates" className="btn btn-outline">
              <ListFilter size={16} />
              Danh Sách Bằng
            </Link>
            <Link to="/admin/data-management" className="btn btn-outline">
              <Users size={16} />
              Học Viên & Khóa Học
            </Link>
          </div>
        </div>

        {/* Web3 Alert Card */}
        <div className="glass-panel" style={{
          padding: "20px 24px",
          marginBottom: "28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          borderColor: wallet ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: wallet ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Wallet size={22} color={wallet ? "#34d399" : "#fbbf24"} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>
                {wallet ? "Ví Quản Trị On-Chain Đã Sẵn Sàng" : "Chưa Kết Nối Ví MetaMask Của Quản Trị Viên"}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                {wallet
                  ? `Địa chỉ ví: ${wallet.address} • Số dư: ${wallet.balance} ETH (Mạng ID: ${wallet.chainId})`
                  : "Bạn cần kết nối ví để ký giao dịch cấp bằng Soulbound Token hoặc thu hồi chứng chỉ."}
              </div>
            </div>
          </div>

          {!wallet && (
            <button
              onClick={async () => {
                const acc = await connectMetaMask();
                setWallet(acc);
              }}
              className="btn btn-gold"
            >
              Kết Nối MetaMask Ngay
            </button>
          )}
        </div>

        {/* 4 Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "36px" }}>
          
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Tổng chứng chỉ</span>
              <Award size={20} color="var(--primary)" />
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800 }}>{certs.length}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Toàn bộ hồ sơ</div>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", color: "#34d399" }}>Đã đúc On-Chain</span>
              <CheckCircle2 size={20} color="#34d399" />
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "#34d399" }}>{issuedCount}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Hợp lệ vĩnh viễn</div>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", color: "#f87171" }}>Đã thu hồi (Revoked)</span>
              <XCircle size={20} color="#f87171" />
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "#f87171" }}>{revokedCount}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Ghi nhận vi phạm</div>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", color: "#fbbf24" }}>Bản nháp (Pending)</span>
              <Clock size={20} color="#fbbf24" />
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "#fbbf24" }}>{pendingCount}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Chờ Admin ký ví</div>
          </div>

        </div>

        {/* Recent Certificates Table Preview */}
        <div className="glass-panel" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Chứng Chỉ Gần Đây</h3>
            <Link to="/admin/certificates" style={{ color: "var(--primary)", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
              Xem toàn bộ danh sách <ArrowUpRight size={14} />
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)", color: "var(--text-muted)", fontSize: "12px" }}>
                  <th style={{ padding: "12px 10px" }}>MÃ BẰNG</th>
                  <th style={{ padding: "12px 10px" }}>HỌC VIÊN</th>
                  <th style={{ padding: "12px 10px" }}>KHÓA HỌC & ĐIỂM</th>
                  <th style={{ padding: "12px 10px" }}>NGÀY CẤP</th>
                  <th style={{ padding: "12px 10px" }}>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {certs.slice(0, 5).map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "14px 10px", fontWeight: 600, color: "var(--primary)" }}>{c.certificate_code}</td>
                    <td style={{ padding: "14px 10px" }}>
                      <div style={{ fontWeight: 600 }}>{c.student_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.student_code}</div>
                    </td>
                    <td style={{ padding: "14px 10px" }}>
                      <div>{c.course_name}</div>
                      <div style={{ fontSize: "12px", color: "var(--accent-gold)", fontWeight: 700 }}>{c.score}</div>
                    </td>
                    <td style={{ padding: "14px 10px", color: "var(--text-secondary)" }}>{c.issue_date}</td>
                    <td style={{ padding: "14px 10px" }}>
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
    </div>
  );
}
