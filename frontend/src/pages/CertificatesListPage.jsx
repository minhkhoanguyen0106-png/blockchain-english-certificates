import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Eye,
  AlertOctagon,
  AlertTriangle,
  RefreshCw,
  Plus,
  Download,
  Trash2,
  Sparkles,
  X,
  Award,
  ExternalLink,
  FileText
} from "lucide-react";
import {
  revokeCertificateOnChain,
  shortenAddress,
  connectMetaMask,
  isMetaMaskInstalled
} from "../services/web3Service";
import { API_BASE_URL, certificateApi, courseApi } from "../services/apiService";
import CertificateCard from "../components/CertificateCard";
import { toast } from "../components/ToastContainer";

const formatDateVN = (val) => {
  if (!val) return "—";
  const str = String(val).slice(0, 10);
  const parts = str.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : str;
};

const hasTokenId = (val) => val !== null && val !== undefined && val !== "";

export default function CertificatesListPage({ wallet, setWallet, user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";
  const isAdmin = user?.role === "ADMIN";

  const [certs, setCerts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // Detail Modal state (hydrated via GET /api/certificates/:id)
  const [selectedCert, setSelectedCert] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete Draft Modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Revoke Modal state
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [reconcilingCode, setReconcilingCode] = useState("");

  useEffect(() => {
    const paramStatus = searchParams.get("status") || "ALL";
    setStatusFilter(paramStatus);
  }, [searchParams]);

  const handleStatusFilterChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    const nextParams = new URLSearchParams(searchParams);
    if (nextStatus === "ALL") {
      nextParams.delete("status");
    } else {
      nextParams.set("status", nextStatus);
    }
    setSearchParams(nextParams, { replace: true });
  };

  // Close open modals cleanly on Escape key (when not mid-request)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (selectedCert) setSelectedCert(null);
      else if (deleteTarget && !deleting) setDeleteTarget(null);
      else if (revokeTarget && !revoking) {
        setRevokeTarget(null);
        setRevokeReason("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedCert, deleteTarget, deleting, revokeTarget, revoking]);

  const getPendingReconcileMap = () => {
    try {
      return JSON.parse(localStorage.getItem("koheni_pending_reconcile") || "{}");
    } catch {
      return {};
    }
  };

  const deriveEffectiveStatus = (d, pendingReconcileMap) => {
    const rec = pendingReconcileMap[d.certificate_code];
    if (d.status === "PENDING") {
      if (rec) return "PENDING_RECONCILE";
      if (d.ipfs_hash) return "READY_TO_MINT";
      return "PENDING";
    }
    if (d.status === "ISSUED_ON_CHAIN" && d.expiry_date) {
      const expiryStr = String(d.expiry_date).slice(0, 10);
      const expiryMs = new Date(`${expiryStr}T23:59:59`).getTime();
      if (!Number.isNaN(expiryMs) && expiryMs < Date.now()) {
        return "EXPIRED";
      }
    }
    return d.status;
  };

  const loadCerts = useCallback(async () => {
    setLoading(true);
    setApiError("");
    try {
      const [res, crsRes] = await Promise.allSettled([
        certificateApi.getCertificates({ limit: 100, status: "ALL" }),
        courseApi.getCourses()
      ]);

      if (crsRes.status === "fulfilled" && crsRes.value?.success && Array.isArray(crsRes.value.data)) {
        setCourses(crsRes.value.data);
      }

      const pendingReconcileMap = getPendingReconcileMap();

      if (res.status === "fulfilled" && res.value?.success && Array.isArray(res.value.data)) {
        const mapped = res.value.data.map((d) => {
          const rec = pendingReconcileMap[d.certificate_code];
          const effectiveStatus = deriveEffectiveStatus(d, pendingReconcileMap);
          return {
            ...d,
            raw_status: d.status,
            status: effectiveStatus,
            reconcile_info: rec || null,
            score: d.score_overall,
            listening: d.score_listening ?? d.listening ?? "",
            reading: d.score_reading ?? d.reading ?? "",
            writing: d.score_writing ?? d.writing ?? "",
            speaking: d.score_speaking ?? d.speaking ?? "",
            issue_date: d.issue_date ? String(d.issue_date).slice(0, 10) : "",
            expiry_date: d.expiry_date ? String(d.expiry_date).slice(0, 10) : "",
            pdf_url: `${API_BASE_URL}/public/pdf/${d.certificate_code}`
          };
        });
        setCerts(mapped);
        return;
      }

      setApiError("Không thể tải danh sách chứng chỉ từ máy chủ. Vui lòng kiểm tra kết nối Backend và thử lại.");
    } catch {
      setApiError("Không thể tải danh sách chứng chỉ từ máy chủ. Vui lòng kiểm tra kết nối Backend và thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCerts();
  }, [loadCerts]);

  // Hydrate full detail (4 sub-scores, revoke_reason, rejection_reason, ipfs_hash, wallet) when opening preview modal
  const handleViewCert = async (cert) => {
    setSelectedCert(cert);
    if (!cert?.id) return;
    setLoadingDetail(true);
    try {
      const res = await certificateApi.getCertificateById(cert.id);
      if (res?.success && res.data) {
        const d = res.data;
        const pendingReconcileMap = getPendingReconcileMap();
        setSelectedCert({
          ...cert,
          ...d,
          raw_status: d.status,
          status: deriveEffectiveStatus(d, pendingReconcileMap),
          score: d.score_overall || cert.score,
          listening: d.score_listening ?? "",
          reading: d.score_reading ?? "",
          writing: d.score_writing ?? "",
          speaking: d.score_speaking ?? "",
          wallet_address: d.student_wallet || d.wallet_address || cert.wallet_address || "",
          issue_date: d.issue_date ? String(d.issue_date).slice(0, 10) : cert.issue_date,
          expiry_date: d.expiry_date ? String(d.expiry_date).slice(0, 10) : cert.expiry_date,
          revoked_reason: d.revoke_reason || d.revoked_reason || null,
          revoked_at: d.revoked_at ? String(d.revoked_at).slice(0, 10) : null,
          pdf_url: `${API_BASE_URL}/public/pdf/${d.certificate_code}`
        });
      }
    } catch {
      // Giữ thông tin cơ bản nếu API chi tiết tạm lỗi
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleReconcileRow = async (cert) => {
    const rec = cert.reconcile_info;
    if (!rec?.tx_hash || !hasTokenId(rec?.token_id)) {
      toast.warning("Không tìm thấy mã giao dịch (Tx Hash) & Token ID chờ đối soát. Vui lòng mở hồ sơ tại trang Duyệt & Cấp Bằng để kiểm tra.");
      return;
    }

    setReconcilingCode(cert.certificate_code);
    try {
      await certificateApi.confirmMint({
        certificate_id: cert.id,
        tx_hash: rec.tx_hash,
        token_id: String(rec.token_id)
      });
      try {
        const map = getPendingReconcileMap();
        delete map[cert.certificate_code];
        localStorage.setItem("koheni_pending_reconcile", JSON.stringify(map));
      } catch {}
      toast.success(`Đã đối soát và xác minh thành công chứng chỉ [${cert.certificate_code}]!`);
      await loadCerts();
    } catch (err) {
      toast.error("Đối soát chưa thành công: " + (err.message || err));
    } finally {
      setReconcilingCode("");
    }
  };

  const pendingQueueCount = certs.filter(
    (c) => c.status === "PENDING" || c.status === "READY_TO_MINT" || c.status === "PENDING_RECONCILE"
  ).length;

  const filteredCerts = certs.filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      !q ||
      (c.certificate_code || "").toLowerCase().includes(q) ||
      (c.student_name || "").toLowerCase().includes(q) ||
      (c.student_code || "").toLowerCase().includes(q) ||
      (c.citizen_id || "").toLowerCase().includes(q);

    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING"
        ? c.status === "PENDING" || c.status === "READY_TO_MINT" || c.status === "PENDING_RECONCILE"
        : c.status === statusFilter);

    const matchCourse = courseFilter === "ALL" || c.course_code === courseFilter;
    return matchSearch && matchStatus && matchCourse;
  });

  const handleConfirmDeleteDraft = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.id) {
        await certificateApi.deleteCertificate(deleteTarget.id);
      }
      const deletedCode = deleteTarget.certificate_code;
      setCerts((prev) => prev.filter((c) => c.certificate_code !== deletedCode));
      try {
        const raw = localStorage.getItem("certchain_certificates");
        if (raw) {
          const list = JSON.parse(raw).filter((c) => c.certificate_code !== deletedCode);
          localStorage.setItem("certchain_certificates", JSON.stringify(list));
        }
      } catch {}
      setDeleteTarget(null);
      toast.success(`Đã xóa bỏ hồ sơ [${deletedCode}] thành công!`);
    } catch (err) {
      toast.error("Lỗi khi xóa hồ sơ: " + (err.message || err));
    } finally {
      setDeleting(false);
    }
  };

  const closeRevokeModal = () => {
    if (revoking) return;
    setRevokeTarget(null);
    setRevokeReason("");
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    if (!isAdmin) {
      toast.error("Chỉ Quản trị viên (ADMIN) mới có thẩm quyền thu hồi chứng chỉ!");
      return;
    }
    if (!hasTokenId(revokeTarget.token_id)) {
      toast.error("Chứng chỉ này thiếu Token ID on-chain hợp lệ nên không thể ký thu hồi.");
      return;
    }
    const cleanReason = revokeReason.trim();
    if (!cleanReason) {
      toast.warning("Vui lòng nhập lý do thu hồi chứng chỉ!");
      return;
    }

    setRevoking(true);
    try {
      let activeWallet = wallet;
      if (!activeWallet?.signer) {
        if (!isMetaMaskInstalled()) {
          throw new Error("Vui lòng cài đặt hoặc mở khóa ví MetaMask của Quản trị viên trước khi ký thu hồi.");
        }
        activeWallet = await connectMetaMask();
        if (activeWallet && setWallet) {
          setWallet(activeWallet);
        }
      }
      if (!activeWallet?.signer) {
        throw new Error("Không lấy được chữ ký ví MetaMask của Quản trị viên.");
      }

      await revokeCertificateOnChain(
        revokeTarget.certificate_code,
        cleanReason,
        revokeTarget.id,
        revokeTarget.token_id,
        activeWallet
      );
      await loadCerts();
      const revokedCode = revokeTarget.certificate_code;
      setRevokeTarget(null);
      setRevokeReason("");
      toast.success(`Đã ghi nhận thu hồi on-chain thành công chứng chỉ [${revokedCode}]!`);
    } catch (err) {
      toast.error("Lỗi khi thu hồi: " + (err.message || err));
    } finally {
      setRevoking(false);
    }
  };

  const isPubliclyIssued = (status) =>
    status === "ISSUED_ON_CHAIN" || status === "REVOKED" || status === "EXPIRED";

  const handleOpenPdf = async (certificateCode) => {
    try {
      await certificateApi.openCertificatePdf(certificateCode);
    } catch (err) {
      toast.error(err.message || "Không thể tải file PDF chứng chỉ từ IPFS.");
    }
  };

  return (
    <div className="admin-page admin-certificates">
      {/* Offline / API Error Banner */}
      {apiError && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 16px",
            borderRadius: "14px",
            background: "rgba(239, 68, 68, 0.09)",
            border: "1px solid rgba(239, 68, 68, 0.28)",
            color: "var(--danger-text)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px"
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
            <AlertTriangle size={16} />
            {apiError}
          </span>
          <button type="button" onClick={loadCerts} className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "12px" }}>
            Thử lại
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            {isAdmin ? "Danh Sách & Thu Hồi Chứng Chỉ" : "Danh Sách Chứng Chỉ Khảo Thí"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13.5px", marginTop: "3px" }}>
            {isAdmin
              ? "Quản lý toàn bộ hồ sơ chứng chỉ điện tử đã phát hành và hủy hiệu lực khi có vi phạm."
              : "Theo dõi tiến độ duyệt hồ sơ nháp và tra cứu danh sách chứng chỉ của trung tâm."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button type="button" onClick={loadCerts} className="finnova-icon-circle" title="Làm mới danh sách">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <Link to="/admin/certificates/issue" className="finnova-cta-pill">
            <Plus size={16} />
            {isAdmin ? "Cấp Bằng Mới" : "Soạn Bản Nháp"}
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="finnova-kpi-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div className="filter-controls-wrap">
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Tìm theo mã bằng, tên học viên, mã học viên hoặc số CCCD..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: "100%", paddingLeft: "38px", paddingRight: searchTerm ? "34px" : "14px" }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "13px" }} />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Xóa từ khóa tìm kiếm"
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "11px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex"
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="form-select"
          >
            <option value="ALL">Tất cả trạng thái ({certs.length})</option>
            <option value="PENDING">Chờ duyệt / xử lý ({pendingQueueCount})</option>
            <option value="ISSUED_ON_CHAIN">Đang hiệu lực ({certs.filter((c) => c.status === "ISSUED_ON_CHAIN").length})</option>
            <option value="READY_TO_MINT">Sẵn sàng cấp ({certs.filter((c) => c.status === "READY_TO_MINT").length})</option>
            <option value="PENDING_RECONCILE">Chờ đối soát ({certs.filter((c) => c.status === "PENDING_RECONCILE").length})</option>
            <option value="REJECTED">Bị từ chối ({certs.filter((c) => c.status === "REJECTED").length})</option>
            <option value="REVOKED">Đã thu hồi ({certs.filter((c) => c.status === "REVOKED").length})</option>
            <option value="EXPIRED">Đã hết hạn ({certs.filter((c) => c.status === "EXPIRED").length})</option>
          </select>

          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="form-select">
            <option value="ALL">Tất cả khóa học</option>
            {courses.length > 0 ? (
              courses.map((cr) => (
                <option key={cr.course_code} value={cr.course_code}>{cr.course_name}</option>
              ))
            ) : (
              Array.from(new Map(certs.filter((c) => c.course_code).map((c) => [c.course_code, c.course_name || c.course_code])).entries()).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))
            )}
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", fontSize: "12px", color: "var(--text-muted)" }}>
          <span>
            Hiển thị <strong style={{ color: "var(--text-primary)" }}>{filteredCerts.length}</strong> / {certs.length} hồ sơ chứng chỉ
          </span>
          {(searchTerm || statusFilter !== "ALL" || courseFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCourseFilter("ALL");
                handleStatusFilterChange("ALL");
              }}
              style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table of Certificates */}
      <div className="finnova-kpi-card" style={{ padding: "18px 20px" }}>
        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th>MÃ BẰNG</th>
                <th>HỌC VIÊN</th>
                <th>KHÓA HỌC &amp; ĐIỂM</th>
                <th>NGÀY CẤP</th>
                <th>TRẠNG THÁI</th>
                <th>THÔNG TIN XÁC THỰC</th>
                <th style={{ textAlign: "right" }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
                      <RefreshCw size={16} className="animate-spin" />
                      Đang tải danh sách chứng chỉ...
                    </div>
                  </td>
                </tr>
              ) : filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "15px", fontWeight: 600 }}>Không tìm thấy chứng chỉ nào phù hợp</div>
                    <div style={{ fontSize: "13px", marginTop: "4px" }}>Vui lòng thay đổi từ khóa hoặc bộ lọc trạng thái.</div>
                  </td>
                </tr>
              ) : (
                filteredCerts.map((c) => (
                  <tr key={c.id || c.certificate_code}>
                    <td style={{ fontWeight: 700, color: "var(--primary)", fontFamily: "monospace", fontSize: "13px", whiteSpace: "nowrap" }}>
                      {c.certificate_code}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{c.student_name}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {c.student_code}
                        {c.citizen_id && <span> • CCCD: {c.citizen_id}</span>}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500, minWidth: "150px" }}>{c.course_name}</div>
                      <div style={{ fontSize: "12.5px", color: "#0369a1", fontWeight: 700, marginTop: "2px", whiteSpace: "nowrap" }}>{c.score}</div>
                    </td>

                    <td style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      <div>{formatDateVN(c.issue_date)}</div>
                      {c.expiry_date && (
                        <div style={{ fontSize: "11px", color: c.status === "EXPIRED" ? "var(--danger-text)" : "var(--text-muted)" }}>
                          Hạn: {formatDateVN(c.expiry_date)}
                        </div>
                      )}
                    </td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      {c.status === "ISSUED_ON_CHAIN" && <span className="badge badge-success">Hợp Lệ</span>}
                      {c.status === "REVOKED" && <span className="badge badge-danger">Đã Thu Hồi</span>}
                      {c.status === "PENDING" && <span className="badge badge-warning">Chờ Duyệt</span>}
                      {c.status === "READY_TO_MINT" && <span className="badge badge-info">Sẵn Sàng Cấp</span>}
                      {c.status === "PENDING_RECONCILE" && <span className="badge badge-warning">Chờ Đối Soát</span>}
                      {c.status === "REJECTED" && (
                        <div>
                          <span className="badge badge-danger">Bị Từ Chối</span>
                          {(c.rejection_reason || c.reject_reason) && (
                            <div style={{ fontSize: "11px", color: "var(--danger-text)", marginTop: "4px", maxWidth: "180px", lineHeight: 1.35 }}>
                              Lý do: {c.rejection_reason || c.reject_reason}
                            </div>
                          )}
                        </div>
                      )}
                      {c.status === "EXPIRED" && (
                        <span className="badge" style={{ background: "rgba(148, 163, 184, 0.15)", color: "#64748b", border: "1px solid rgba(148, 163, 184, 0.35)" }}>
                          Hết Hạn
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: "11.5px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {hasTokenId(c.token_id)
                          ? `Token #${c.token_id}`
                          : hasTokenId(c.reconcile_info?.token_id)
                          ? `Token chờ đối soát: #${c.reconcile_info.token_id}`
                          : c.status === "REJECTED"
                          ? "Không phát hành"
                          : c.ipfs_hash
                          ? `CID: ${c.ipfs_hash.slice(0, 12)}...`
                          : "Chưa cấp mã"}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontFamily: c.tx_hash || c.reconcile_info?.tx_hash ? "monospace" : "inherit" }}>
                        {c.tx_hash
                          ? `Tx: ${shortenAddress(c.tx_hash)}`
                          : c.reconcile_info?.tx_hash
                          ? `Tx chờ: ${shortenAddress(c.reconcile_info.tx_hash)}`
                          : c.status === "REJECTED"
                          ? "Đã từ chối duyệt"
                          : c.status === "READY_TO_MINT"
                          ? "Đã lưu PDF lên IPFS"
                          : "Đang chờ phê duyệt"}
                      </div>
                    </td>

                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", gap: "7px", alignItems: "center", justifyContent: "flex-end", flexWrap: "nowrap" }}>
                        <button
                          type="button"
                          onClick={() => handleViewCert(c)}
                          className="btn btn-outline"
                          style={{ padding: "6px 11px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          title="Xem hồ sơ chứng chỉ chi tiết"
                        >
                          <Eye size={14} />
                          Xem
                        </button>

                        {isPubliclyIssued(c.status) && (
                          <button
                            type="button"
                            onClick={() => handleOpenPdf(c.certificate_code)}
                            className="btn btn-outline"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                            title="Tải bản in PDF có mã QR xác thực"
                          >
                            <Download size={14} />
                          </button>
                        )}

                        {(c.status === "PENDING" || c.status === "READY_TO_MINT") && isAdmin && (
                          <Link
                            to={`/admin/certificates/issue?code=${c.certificate_code}`}
                            className="btn btn-gold"
                            style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            title={c.status === "READY_TO_MINT" ? "Hồ sơ đã sẵn sàng IPFS — Ký MetaMask cấp bằng" : "Kiểm tra, chuẩn bị IPFS và ký phát hành"}
                          >
                            <Sparkles size={13} />
                            {c.status === "READY_TO_MINT" ? "Ký Cấp Ngay" : "Duyệt & Cấp"}
                          </Link>
                        )}

                        {c.status === "REJECTED" && !isAdmin && (
                          <Link
                            to={`/admin/certificates/issue?student=${encodeURIComponent(c.student_code || "")}&course=${encodeURIComponent(c.course_code || "")}`}
                            className="btn btn-primary"
                            style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            title="Soạn lại hồ sơ mới cho học viên này"
                          >
                            <FileText size={13} />
                            Soạn Lại
                          </Link>
                        )}

                        {(c.status === "PENDING" || c.status === "REJECTED") && !isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(c)}
                            className="btn btn-outline"
                            style={{
                              padding: "6px 11px",
                              fontSize: "12px",
                              color: "var(--danger-text)",
                              borderColor: "rgba(225, 29, 72, 0.35)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            title={c.status === "REJECTED" ? "Xóa hồ sơ bị từ chối này" : "Xóa bỏ bản nháp chờ duyệt này"}
                          >
                            <Trash2 size={13} />
                            {c.status === "REJECTED" ? "Xóa" : "Bỏ Nháp"}
                          </button>
                        )}

                        {c.status === "PENDING_RECONCILE" && isAdmin && (
                          <button
                            type="button"
                            disabled={reconcilingCode === c.certificate_code}
                            onClick={() => handleReconcileRow(c)}
                            className="btn btn-primary"
                            style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            title="Gửi lại yêu cầu Backend xác minh giao dịch on-chain đã ký"
                          >
                            <RefreshCw size={13} className={reconcilingCode === c.certificate_code ? "animate-spin" : ""} />
                            Đối Soát
                          </button>
                        )}

                        {(c.status === "ISSUED_ON_CHAIN" || c.status === "EXPIRED") && isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setRevokeReason("");
                              setRevokeTarget(c);
                            }}
                            className="btn btn-danger"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            title="Thu hồi chứng chỉ (Chỉ Quản trị viên)"
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
      </div>

      {/* Delete Draft Confirmation Modal */}
      {deleteTarget && (
        <div
          onClick={() => { if (!deleting) setDeleteTarget(null); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-modal-backdrop)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{ maxWidth: "460px", width: "100%", padding: "28px", background: "var(--bg-surface-elevated)", borderColor: "rgba(225, 29, 72, 0.3)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", color: "var(--danger-text)" }}>
              <Trash2 size={22} />
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>
                {deleteTarget.status === "REJECTED" ? "Xác Nhận Xóa Hồ Sơ Bị Từ Chối" : "Xác Nhận Xóa Bản Nháp"}
              </h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: 1.55, marginBottom: "20px" }}>
              Bạn có chắc chắn muốn xóa bỏ hồ sơ <strong>{deleteTarget.certificate_code}</strong> của học viên <strong>{deleteTarget.student_name}</strong>? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="btn btn-outline">
                Hủy Bỏ
              </button>
              <button type="button" disabled={deleting} onClick={handleConfirmDeleteDraft} className="btn btn-danger">
                {deleting ? "Đang xóa..." : "Xác Nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {revokeTarget && (
        <div
          onClick={closeRevokeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-modal-backdrop)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{
              maxWidth: "500px",
              width: "100%",
              padding: "32px",
              background: "var(--bg-surface-elevated)",
              borderColor: "rgba(225, 29, 72, 0.35)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", color: "var(--danger-text)" }}>
              <AlertOctagon size={26} />
              <h3 style={{ fontSize: "20px", fontWeight: 800 }}>Xác Nhận Thu Hồi Chứng Chỉ</h3>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.5, marginBottom: "14px" }}>
              Hành động này sẽ hủy bỏ vĩnh viễn tính hiệu lực của chứng chỉ trên toàn hệ thống và không thể phục hồi.
            </p>

            {/* Checklist đối soát trước khi ký */}
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 14px",
              marginBottom: "16px",
              fontSize: "12px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Mã chứng chỉ:</span>
                <strong style={{ color: "var(--primary)" }}>{revokeTarget.certificate_code}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Học viên sở hữu:</span>
                <span style={{ fontWeight: 600 }}>{revokeTarget.student_name} ({revokeTarget.student_code})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Khóa học &amp; Điểm:</span>
                <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>{revokeTarget.course_name} • {revokeTarget.score}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Token ID on-chain:</span>
                <span>{hasTokenId(revokeTarget.token_id) ? `#${revokeTarget.token_id}` : "N/A"}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: "var(--danger-text)" }}>
                Lý do thu hồi (Bắt buộc ghi nhận trên hệ thống):
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
                onClick={closeRevokeModal}
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
                    Đang ký xác thực...
                  </>
                ) : (
                  "Ký Xác Thực & Thu Hồi Vĩnh Viễn"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Preview Modal */}
      {selectedCert && (
        <div
          onClick={() => setSelectedCert(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-modal-backdrop)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{
              maxWidth: "840px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "28px",
              background: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Award size={22} color="var(--primary)" />
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>
                  Hồ Sơ Chứng Chỉ: <span style={{ color: "var(--primary)" }}>{selectedCert.certificate_code}</span>
                </h3>
                {loadingDetail && <RefreshCw size={14} className="animate-spin" color="var(--text-muted)" />}
              </div>
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "6px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {selectedCert.status === "REJECTED" && (selectedCert.rejection_reason || selectedCert.reject_reason) && (
              <div style={{
                background: "var(--danger-bg)",
                border: "1px solid rgba(225, 29, 72, 0.3)",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                marginBottom: "18px",
                fontSize: "13px",
                color: "var(--danger-text)"
              }}>
                <strong>Lý do từ chối hồ sơ:</strong> {selectedCert.rejection_reason || selectedCert.reject_reason}
              </div>
            )}

            {selectedCert.status === "REVOKED" && (selectedCert.revoked_reason || selectedCert.revoke_reason) && (
              <div style={{
                background: "var(--danger-bg)",
                border: "1px solid rgba(225, 29, 72, 0.3)",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                marginBottom: "18px",
                fontSize: "13px",
                color: "var(--danger-text)"
              }}>
                <strong>Lý do thu hồi chứng chỉ:</strong> {selectedCert.revoked_reason || selectedCert.revoke_reason}
                {selectedCert.revoked_at && (
                  <span style={{ marginLeft: "8px", opacity: 0.8 }}>(Ngày {formatDateVN(selectedCert.revoked_at)})</span>
                )}
              </div>
            )}

            <div style={{ marginBottom: "24px" }}>
              <CertificateCard cert={selectedCert} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
              {isPubliclyIssued(selectedCert.status) ? (
                <a
                  href={`/verify?code=${selectedCert.certificate_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <ExternalLink size={14} /> Mở Trang Tra Cứu Công Khai (Tab Mới)
                </a>
              ) : (
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Hồ sơ chưa phát hành chính thức nên chưa hiển thị trên cổng tra cứu công khai.
                </span>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                {isPubliclyIssued(selectedCert.status) && (
                  <button
                    type="button"
                    onClick={() => handleOpenPdf(selectedCert.certificate_code)}
                    className="btn btn-gold"
                    style={{ fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <Download size={14} /> Tải Bản In PDF
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="btn btn-primary"
                  style={{ fontSize: "13px" }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
