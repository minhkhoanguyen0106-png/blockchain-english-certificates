import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ListFilter, Search, ShieldAlert, ExternalLink, Eye, AlertOctagon, RefreshCw, Plus, Filter } from "lucide-react";
import { getAllCertificates, revokeCertificateOnChain, shortenAddress } from "../services/web3Service";

export default function CertificatesListPage({ wallet, user }) {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [certs, setCerts] = useState(getAllCertificates());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
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
      await new Promise(r => setTimeout(r, 900));
      await revokeCertificateOnChain(revokeTarget.certificate_code, revokeReason);
      setCerts(getAllCertificates());
      setRevokeTarget(null);
      setRevokeReason("");
      alert("Đã ghi nhận thu hồi chứng chỉ thành công trên Smart Contract!");
    } catch (err) {
      alert("Lỗi khi thu hồi: " + (err.message || err));
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-primary)" }}>
            Danh Sách & <span className="text-gradient">Thu Hồi Chứng Chỉ</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Quản lý toàn bộ hồ sơ chứng chỉ Soulbound Token đã phát hành on-chain và hủy hiệu lực khi có vi phạm.
          </p>
        </div>

        <Link to="/admin/certificates/issue" className="btn btn-primary">
          <Plus size={16} />
          {user?.role === "ADMIN" ? "Cấp Bằng Mới" : "Soạn Bản Nháp"}
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

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select" style={{ minWidth: "180px" }}>
            <option value="ALL">Tất cả trạng thái ({certs.length})</option>
            <option value="ISSUED_ON_CHAIN">Hợp lệ On-Chain ({certs.filter(c => c.status === "ISSUED_ON_CHAIN").length})</option>
            <option value="REVOKED">Đã thu hồi ({certs.filter(c => c.status === "REVOKED").length})</option>
            <option value="PENDING">Bản nháp Draft ({certs.filter(c => c.status === "PENDING").length})</option>
          </select>

          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="form-select" style={{ minWidth: "170px" }}>
            <option value="ALL">Tất cả khóa học</option>
            <option value="IELTS-ACAD">IELTS Academic</option>
            <option value="TOEIC-INT">TOEIC 4 Kỹ Năng</option>
            <option value="VSTEP-C1">VSTEP B2-C1</option>
          </select>

        </div>
      </div>

      {/* Table of Certificates */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th>MÃ BẰNG</th>
                <th>HỌC VIÊN</th>
                <th>KHÓA HỌC & ĐIỂM</th>
                <th>NGÀY CẤP</th>
                <th>TRẠNG THÁI</th>
                <th>ON-CHAIN PROOF</th>
                <th style={{ textAlign: "right" }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "15px", fontWeight: 600 }}>Không tìm thấy chứng chỉ nào phù hợp</div>
                    <div style={{ fontSize: "13px", marginTop: "4px" }}>Vui lòng thay đổi từ khóa hoặc bộ lọc trạng thái.</div>
                  </td>
                </tr>
              ) : (
                filteredCerts.map((c) => (
                  <tr key={c.id}>
                    
                    <td style={{ fontWeight: 700, color: "var(--primary)" }}>
                      {c.certificate_code}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{c.student_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.student_code}</div>
                    </td>

                    <td>
                      <div>{c.course_name}</div>
                      <div style={{ fontSize: "12px", color: "var(--accent-gold)", fontWeight: 700 }}>{c.score}</div>
                    </td>

                    <td style={{ color: "var(--text-secondary)" }}>
                      {c.issue_date}
                    </td>

                    <td>
                      {c.status === "ISSUED_ON_CHAIN" && <span className="badge badge-success">Hợp Lệ</span>}
                      {c.status === "REVOKED" && <span className="badge badge-danger">Đã Thu Hồi</span>}
                      {c.status === "PENDING" && <span className="badge badge-warning">Draft</span>}
                    </td>

                    <td style={{ fontSize: "11px" }}>
                      <div>Token #{c.token_id || "N/A"}</div>
                      <div style={{ color: "var(--text-muted)" }}>
                        {c.tx_hash ? `Tx: ${shortenAddress(c.tx_hash)}` : "Chưa lên chuỗi"}
                      </div>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <Link
                          to={`/verify?code=${c.certificate_code}`}
                          className="btn btn-outline"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                          title="Xem trên trang thẩm định công khai"
                        >
                          <Eye size={14} />
                          Xem
                        </Link>

                        {c.status === "ISSUED_ON_CHAIN" && (
                          user?.role === "ADMIN" ? (
                            <button
                              type="button"
                              onClick={() => setRevokeTarget(c)}
                              className="btn btn-danger"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                              title="Thu hồi chứng chỉ on-chain (Chỉ Quản trị viên)"
                            >
                              <AlertOctagon size={14} />
                              Thu Hồi
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="btn btn-outline"
                              style={{ padding: "6px 12px", fontSize: "12px", opacity: 0.5 }}
                              title="Chỉ Quản trị viên (ADMIN) mới có quyền thu hồi on-chain"
                            >
                              Thu Hồi (Khóa)
                            </button>
                          )
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoke Confirmation Modal */}
      {revokeTarget && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "var(--bg-modal-backdrop)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "20px"
        }}>
          <div className="glass-panel" style={{
            maxWidth: "500px",
            width: "100%",
            padding: "32px",
            background: "var(--bg-surface-elevated)",
            borderColor: "rgba(239, 68, 68, 0.4)"
          }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", color: "var(--danger-text)" }}>
              <AlertOctagon size={28} />
              <h3 style={{ fontSize: "20px", fontWeight: 800 }}>Xác Nhận Thu Hồi Chứng Chỉ</h3>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.5, marginBottom: "16px" }}>
              Hành động này sẽ thực thi giao dịch gọi hàm <code>revokeCertificate()</code> trên Smart Contract và chuyển trạng thái của bằng <strong>{revokeTarget.certificate_code}</strong> ({revokeTarget.student_name}) sang <strong>REVOKED</strong> vĩnh viễn trên sổ cái Blockchain.
            </p>

            <div className="form-group">
              <label className="form-label" style={{ color: "var(--danger-text)" }}>
                Lý do thu hồi (Bắt buộc ghi nhận on-chain):
              </label>
              <textarea
                rows="3"
                required
                placeholder="Ví dụ: Gian lận thi cử ca thi ngày 20/10 hoặc thông tin điểm số sai lệch..."
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
                    Đang gửi transaction...
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
  );
}
