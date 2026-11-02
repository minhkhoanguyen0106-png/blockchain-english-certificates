import React from "react";
import { Link } from "react-router-dom";
import { Award, FilePlus, ListFilter, Users, CheckCircle2, XCircle, Clock, ShieldAlert, ArrowUpRight, Wallet, Sparkles, Layers } from "lucide-react";
import { getAllCertificates, shortenAddress, connectMetaMask } from "../services/web3Service";

export default function DashboardPage({ wallet, setWallet, user }) {
  const certs = getAllCertificates();
  const issuedCount = certs.filter(c => c.status === "ISSUED_ON_CHAIN").length;
  const revokedCount = certs.filter(c => c.status === "REVOKED").length;
  const pendingCount = certs.filter(c => c.status === "PENDING").length;

  return (
    <div>
      {/* Top Welcome Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-primary)" }}>
            Bảng Điều Khiển <span className="text-gradient">Quản Trị</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Xin chào, <strong>{user?.full_name || "Quản trị viên"}</strong> • Thẩm quyền:{" "}
            <span className={`badge ${user?.role === "ADMIN" ? "badge-success" : "badge-warning"}`}>
              {user?.role || "ADMIN"}
            </span>
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link to="/admin/certificates/issue" className="btn btn-primary">
            <FilePlus size={16} />
            {user?.role === "ADMIN" ? "Cấp Bằng On-Chain" : "Soạn Bản Nháp Mới"}
          </Link>
          <Link to="/admin/certificates" className="btn btn-outline">
            <ListFilter size={16} />
            Danh Sách Bằng
          </Link>
          <Link to="/admin/data-management" className="btn btn-outline">
            <Users size={16} />
            Dữ Liệu Khảo Thí
          </Link>
        </div>
      </div>

      {/* Web3 Alert Card */}
      <div className="glass-panel" style={{
        padding: "18px 22px",
        marginBottom: "28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        borderLeft: wallet ? "4px solid var(--success-color)" : "4px solid var(--warning-color)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: wallet ? "var(--success-bg)" : "var(--warning-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Wallet size={20} color={wallet ? "var(--success-text)" : "var(--warning-text)"} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
              {wallet ? "Ví Quản Trị On-Chain Đã Sẵn Sàng Ký Hợp Đồng" : "Chưa Kết Nối Ví MetaMask Của Quản Trị Viên"}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
              {wallet
                ? `Địa chỉ ví: ${wallet.address} • Số dư: ${wallet.balance} ETH (Chain ID: ${wallet.chainId})`
                : "Cần kết nối ví để ký phát hành Soulbound Token (SBT) hoặc thực thi thu hồi chứng chỉ khi có vi phạm."}
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
            style={{ fontSize: "13px", padding: "8px 16px" }}
          >
            Kết Nối MetaMask Ngay
          </button>
        )}
      </div>

      {/* 4 Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        
        <Link to="/admin/certificates" className="glass-panel" style={{ padding: "22px", display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>TỔNG CHỨNG CHỈ</span>
            <Award size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)" }}>{certs.length}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Toàn bộ hồ sơ trên hệ thống</div>
        </Link>

        <Link to="/admin/certificates" className="glass-panel" style={{ padding: "22px", display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--success-text)", fontWeight: 600 }}>ĐÃ ĐÚC ON-CHAIN</span>
            <CheckCircle2 size={18} color="var(--success-color)" />
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--success-text)" }}>{issuedCount}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Hợp lệ vĩnh viễn trên sổ cái</div>
        </Link>

        <Link to="/admin/certificates" className="glass-panel" style={{ padding: "22px", display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--danger-text)", fontWeight: 600 }}>ĐÃ THU HỒI (REVOKED)</span>
            <XCircle size={18} color="var(--danger-color)" />
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--danger-text)" }}>{revokedCount}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Ghi nhận hủy hiệu lực</div>
        </Link>

        <Link to="/admin/certificates" className="glass-panel" style={{ padding: "22px", display: "block" }}>
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
