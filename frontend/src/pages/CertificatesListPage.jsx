import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ListFilter, Search, ShieldAlert, ArrowLeft, ExternalLink, Eye, AlertOctagon, RefreshCw } from "lucide-react";
import { getAllCertificates, revokeCertificateOnChain, shortenAddress } from "../services/web3Service";

export default function CertificatesListPage({ wallet, user }) {
  const [certs, setCerts] = useState(getAllCertificates());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");

  // Revoke Modal state
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);

  const filteredCerts = certs.filter(c => {
    const matchSearch =
      c.certificate_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.student_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchCourse = courseFilter === "ALL" || c.course_code === courseFilter;
    return matchSearch && matchStatus && matchCourse;
  });

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    if (user?.role !== "ADMIN") {
      alert("LỖI PHÂN QUYỀN (403): Chỉ Quản trị viên (ADMIN) mới có thẩm quyền thu hồi chứng chỉ trên Blockchain!");
      return;
    }
    if (!revokeReason.trim()) {
      alert("Vui lòng nhập lý do thu hồi chứng chỉ!");
      return;
    }

    setRevoking(true);
    try {
      // Giả lập độ trễ ký MetaMask gọi hàm revokeCertificate
      await new Promise(r => setTimeout(r, 1000));
      await revokeCertificateOnChain(revokeTarget.certificate_code, revokeReason);
      setCerts(getAllCertificates());
      setRevokeTarget(null);
      setRevokeReason("");
      alert("Thu hồi chứng chỉ thành công trên Blockchain!");
    } catch (err) {
      alert("Lỗi khi thu hồi: " + (err.message || err));
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div style={{ padding: "36px 0 80px" }}>
      <div className="container">
        
        <div style={{ marginBottom: "20px" }}>
          <Link to="/admin/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "14px" }}>
            <ArrowLeft size={16} /> Quay lại Dashboard
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800 }}>
              Quản Lý Danh Sách & <span className="text-gradient">Thu Hồi Chứng Chỉ</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Toàn bộ hồ sơ chứng chỉ đã phát hành on-chain và chức năng hủy hiệu lực bằng cấp khi có vi phạm.
            </p>
          </div>

          <Link to="/admin/certificates/issue" className="btn btn-primary">
            + Cấp Bằng Mới
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="glass-panel" style={{ padding: "16px 20px", marginBottom: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "12px", alignItems: "center" }}>
            
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Tìm theo mã bằng, tên học viên, mã học viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "38px" }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "14px" }} />
            </div>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select">
              <option value="ALL">-- Tất cả trạng thái --</option>
              <option value="ISSUED_ON_CHAIN">Hợp lệ (On-Chain)</option>
              <option value="REVOKED">Đã thu hồi (Revoked)</option>
              <option value="PENDING">Bản nháp (Draft)</option>
            </select>

            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="form-select">
              <option value="ALL">-- Tất cả khóa học --</option>
              <option value="IELTS-ACAD">IELTS Academic</option>
              <option value="TOEIC-INT">TOEIC 4 Kỹ Năng</option>
              <option value="VSTEP-C1">VSTEP B2-C1</option>
            </select>

          </div>
        </div>

        {/* Table of Certificates */}
        <div className="glass-panel" style={{ padding: "24px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-light)", color: "var(--text-muted)", fontSize: "12px" }}>
                <th style={{ padding: "12px 10px" }}>MÃ BẰNG</th>
                <th style={{ padding: "12px 10px" }}>HỌC VIÊN</th>
                <th style={{ padding: "12px 10px" }}>KHÓA HỌC & ĐIỂM</th>
                <th style={{ padding: "12px 10px" }}>NGÀY CẤP</th>
                <th style={{ padding: "12px 10px" }}>TRẠNG THÁI</th>
                <th style={{ padding: "12px 10px" }}>ON-CHAIN PROOF</th>
                <th style={{ padding: "12px 10px", textAlign: "right" }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Không tìm thấy chứng chỉ nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    
                    <td style={{ padding: "14px 10px", fontWeight: 700, color: "var(--primary)" }}>
                      {c.certificate_code}
                    </td>

                    <td style={{ padding: "14px 10px" }}>
                      <div style={{ fontWeight: 600 }}>{c.student_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.student_code}</div>
                    </td>

                    <td style={{ padding: "14px 10px" }}>
                      <div>{c.course_name}</div>
                      <div style={{ fontSize: "12px", color: "var(--accent-gold)", fontWeight: 700 }}>{c.score}</div>
                    </td>

                    <td style={{ padding: "14px 10px", color: "var(--text-secondary)" }}>
                      {c.issue_date}
                    </td>

                    <td style={{ padding: "14px 10px" }}>
                      {c.status === "ISSUED_ON_CHAIN" && <span className="badge badge-success">Hợp Lệ</span>}
                      {c.status === "REVOKED" && <span className="badge badge-danger">Đã Thu Hồi</span>}
                      {c.status === "PENDING" && <span className="badge badge-warning">Draft</span>}
                    </td>

                    <td style={{ padding: "14px 10px", fontSize: "11px" }}>
                      <div>Token #{c.token_id}</div>
                      <div style={{ color: "var(--text-muted)" }}>Tx: {shortenAddress(c.tx_hash)}</div>
                    </td>

                    <td style={{ padding: "14px 10px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <Link
                          to={`/verify?code=${c.certificate_code}`}
                          className="btn btn-outline"
                          style={{ padding: "6px 10px", fontSize: "12px" }}
                          title="Xem trên trang thẩm định"
                        >
                          <Eye size={14} />
                          Xem
                        </Link>

                        {c.status === "ISSUED_ON_CHAIN" && user?.role === "ADMIN" && (
                          <button
                            type="button"
                            onClick={() => setRevokeTarget(c)}
                            className="btn btn-danger"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                            title="Thu hồi chứng chỉ on-chain (Chỉ Admin)"
                          >
                            <AlertOctagon size={14} />
                            Thu Hồi
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Revoke Confirmation Modal */}
        {revokeTarget && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}>
            <div className="glass-panel" style={{ maxWidth: "500px", width: "100%", padding: "32px", borderColor: "rgba(239, 68, 68, 0.4)" }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", color: "#f87171" }}>
                <AlertOctagon size={28} />
                <h3 style={{ fontSize: "20px", fontWeight: 800 }}>Xác Nhận Thu Hồi Chứng Chỉ</h3>
              </div>

              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.5, marginBottom: "16px" }}>
                Hành động này sẽ gọi hàm <code>revokeCertificate()</code> trên Smart Contract và chuyển trạng thái của bằng <strong>{revokeTarget.certificate_code}</strong> ({revokeTarget.student_name}) sang <strong>REVOKED</strong> vĩnh viễn trên sổ cái Blockchain.
              </p>

              <div className="form-group">
                <label className="form-label" style={{ color: "#fca5a5" }}>Lý do thu hồi (Bắt buộc ghi nhận on-chain):</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Ví dụ: Phát hiện gian lận thi cử ca thi ngày 20/10 hoặc thông tin điểm số sai lệch..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setRevokeTarget(null)}
                  disabled={revoking}
                  className="btn btn-outline"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="button"
                  onClick={handleConfirmRevoke}
                  disabled={revoking}
                  className="btn btn-danger"
                >
                  {revoking ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Đang ký MetaMask...
                    </>
                  ) : (
                    "Ký MetaMask & Thu Hồi Vĩnh Viễn"
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
