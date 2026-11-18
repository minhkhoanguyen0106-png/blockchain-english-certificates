import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  History,
  RefreshCw,
  Download,
  ExternalLink,
  Plus,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  FileText,
  FilePlus,
  SlidersHorizontal,
  ShieldAlert
} from "lucide-react";
import { shortenAddress } from "../services/web3Service";
import { dashboardApi, certificateApi } from "../services/apiService";
import { detectCourseType } from "../services/scoreEngine";
import { toast } from "../components/ToastContainer";

const formatTimeVN = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${hh}:${mm} • ${dd}/${mo}/${yyyy}`;
};

const getAuditLogMeta = (log) => {
  const action = String(log.action || "").toUpperCase();
  const detail = String(log.action_detail || "");
  const detailLower = detail.toLowerCase();

  if (action.includes("REJECT") || detailLower.includes("từ chối")) {
    return {
      title: "Từ chối hồ sơ nháp",
      icon: XCircle,
      iconBg: "rgba(239, 68, 68, 0.11)",
      iconColor: "#dc2626",
      tag: "Từ chối"
    };
  }
  if (action.includes("REVOKE") || detailLower.includes("thu hồi")) {
    return {
      title: "Thu hồi chứng chỉ",
      icon: ShieldAlert,
      iconBg: "rgba(234, 88, 12, 0.12)",
      iconColor: "#ea580c",
      tag: "Thu hồi"
    };
  }
  if (
    action.includes("MINT") ||
    action.includes("ISSUE") ||
    action.includes("CONFIRM") ||
    detailLower.includes("đúc") ||
    detailLower.includes("on-chain") ||
    detailLower.includes("phát hành")
  ) {
    return {
      title: "Phát hành chứng chỉ thành công",
      icon: CheckCircle2,
      iconBg: "rgba(16, 185, 129, 0.12)",
      iconColor: "#059669",
      tag: "Phát hành"
    };
  }
  if (action.includes("DRAFT") || action.includes("CREATE") || detailLower.includes("nháp")) {
    return {
      title: "Tạo hồ sơ nháp mới",
      icon: FilePlus,
      iconBg: "rgba(2, 132, 199, 0.11)",
      iconColor: "#0284c7",
      tag: "Bản nháp"
    };
  }

  // Clean fallback without duplicating certificate_code in title
  const cleaned = log.certificate_code
    ? detail.replace(new RegExp(`(mã\\s+)?${log.certificate_code}`, "gi"), "").trim()
    : detail;

  return {
    title: cleaned || log.action || "Cập nhật hệ thống",
    icon: History,
    iconBg: "rgba(15, 39, 60, 0.08)",
    iconColor: "#475569",
    tag: "Hoạt động"
  };
};

const formatDateVN = (val) => {
  if (!val) return "—";
  const str = String(val).slice(0, 10);
  const parts = str.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : str;
};

const readPendingReconcileMap = () => {
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

export default function DashboardPage({ user }) {
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  const [certs, setCerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | PENDING | ISSUED_ON_CHAIN | REJECTED | REVOKED
  const [selectedId, setSelectedId] = useState(null);

  // Cache hydrated details from GET /api/certificates/:id (sub-scores, rejection/revoke reasons, ipfs, wallet)
  const detailCacheRef = useRef({});
  const [detailById, setDetailById] = useState({});

  const loadDashboardData = async () => {
    setLoading(true);
    setApiError("");
    try {
      const [statsRes, certsRes, logsRes] = await Promise.allSettled([
        dashboardApi.getDashboardStats(),
        certificateApi.getCertificates({ limit: 100, status: "ALL" }),
        dashboardApi.getAuditLogs(6)
      ]);

      const pendingReconcileMap = readPendingReconcileMap();
      let anyBackendOk = false;

      if (statsRes.status === "fulfilled" && statsRes.value?.success) {
        setStats(statsRes.value.data);
        anyBackendOk = true;
      }

      if (certsRes.status === "fulfilled" && certsRes.value?.success && Array.isArray(certsRes.value.data)) {
        const mapped = certsRes.value.data.map((d) => ({
          ...d,
          raw_status: d.status,
          status: deriveEffectiveStatus(d, pendingReconcileMap),
          score: d.score_overall || d.score || "—",
          issue_date: d.issue_date ? String(d.issue_date).slice(0, 10) : "",
          expiry_date: d.expiry_date ? String(d.expiry_date).slice(0, 10) : ""
        }));
        setCerts(mapped);
        detailCacheRef.current = {};
        setDetailById({});
        if (mapped.length > 0) {
          setSelectedId((prev) => (mapped.some((m) => m.id === prev) ? prev : mapped[0].id));
        } else {
          setSelectedId(null);
        }
        anyBackendOk = true;
      }

      if (logsRes.status === "fulfilled" && logsRes.value?.success && Array.isArray(logsRes.value.data)) {
        setAuditLogs(logsRes.value.data);
        anyBackendOk = true;
      }

      if (!anyBackendOk) {
        setApiError("Không thể kết nối máy chủ dữ liệu. Vui lòng kiểm tra Backend API và tải lại.");
      }
    } catch {
      setApiError("Không thể kết nối máy chủ dữ liệu. Vui lòng kiểm tra Backend API và tải lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Derived & backend-synced KPI counts
  const pendingDraftsCount = useMemo(
    () => certs.filter((c) => c.status === "PENDING").length,
    [certs]
  );
  const readyToMintCount = useMemo(
    () => certs.filter((c) => c.status === "READY_TO_MINT").length,
    [certs]
  );
  const reconcileCount = useMemo(
    () => certs.filter((c) => c.status === "PENDING_RECONCILE").length,
    [certs]
  );
  const expiredCount = useMemo(
    () => certs.filter((c) => c.status === "EXPIRED").length,
    [certs]
  );
  const rejectedCount = useMemo(
    () => certs.filter((c) => c.status === "REJECTED").length,
    [certs]
  );

  const totalCount = stats ? Number(stats.totalCertificates) : certs.length;
  const issuedCount = stats
    ? Number(stats.issuedCount)
    : certs.filter((c) => c.status === "ISSUED_ON_CHAIN" || c.status === "EXPIRED").length;
  const revokedCount = stats
    ? Number(stats.revokedCount)
    : certs.filter((c) => c.status === "REVOKED").length;
  const pendingCount = stats
    ? Number(stats.pendingCount)
    : pendingDraftsCount + readyToMintCount + reconcileCount;

  // Correct business ratio on issued certificates (excludes PENDING / REJECTED)
  const totalEverIssued = issuedCount + revokedCount;
  const activeIssuedCount = Math.max(0, issuedCount - expiredCount);
  const validRetentionRate = totalEverIssued > 0
    ? Math.round((issuedCount / totalEverIssued) * 100)
    : 0;
  const revokeRate = totalEverIssued > 0
    ? Math.round((revokedCount / totalEverIssued) * 100)
    : 0;

  // Real 6-month issued certificate bar chart (computed strictly from actual issue_date)
  const monthlyIssuedBars = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        key,
        label: `T${d.getMonth() + 1}`,
        fullLabel: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
        count: 0
      });
    }
    const issuedList = certs.filter((c) => c.raw_status === "ISSUED_ON_CHAIN" || c.status === "ISSUED_ON_CHAIN" || c.status === "EXPIRED");
    issuedList.forEach((c) => {
      if (!c.issue_date) return;
      const ym = String(c.issue_date).slice(0, 7);
      const bucket = months.find((m) => m.key === ym);
      if (bucket) bucket.count += 1;
    });
    const maxCount = Math.max(0, ...months.map((m) => m.count));
    return months.map((m) => ({
      ...m,
      heightPct: maxCount > 0 && m.count > 0 ? Math.max(22, Math.round((m.count / maxCount) * 100)) : 10,
      isPeak: maxCount > 0 && m.count === maxCount
    }));
  }, [certs]);

  // Top 3 exam breakdown from backend courseDistribution (fallback to certs)
  const topExamChannels = useMemo(() => {
    const source = Array.isArray(stats?.courseDistribution) && stats.courseDistribution.length > 0
      ? stats.courseDistribution.map((row) => ({
          code: row.course_code || "",
          name: row.course_name || row.course_code || "Khác",
          count: Number(row.certificate_count || 0)
        }))
      : Object.values(
          certs.reduce((acc, c) => {
            const key = c.course_code || "OTHER";
            if (!acc[key]) acc[key] = { code: key, name: c.course_name || key, count: 0 };
            acc[key].count += 1;
            return acc;
          }, {})
        );

    // Group by short exam family (IELTS, TOEIC, VSTEP, CAMBRIDGE, TOEFL, or course_code)
    const grouped = {};
    source.forEach((item) => {
      const type = detectCourseType(item.code);
      const label = type === "GENERAL" ? (item.code || item.name) : type;
      if (!grouped[label]) grouped[label] = { label, count: 0 };
      grouped[label].count += item.count;
    });

    const sorted = Object.values(grouped).sort((a, b) => b.count - a.count);
    if (sorted.length === 0) {
      return [
        { label: "IELTS", count: 0 },
        { label: "TOEIC", count: 0 },
        { label: "VSTEP", count: 0 }
      ];
    }
    return sorted.slice(0, 3);
  }, [stats, certs]);

  // Master-detail filtered list
  const filteredMasterList = useMemo(() => {
    const list = certs.filter((c) => {
      if (activeTab === "ALL") return true;
      if (activeTab === "PENDING") {
        return c.status === "PENDING" || c.status === "READY_TO_MINT" || c.status === "PENDING_RECONCILE";
      }
      if (activeTab === "ISSUED_ON_CHAIN") {
        return c.status === "ISSUED_ON_CHAIN" || c.status === "EXPIRED";
      }
      return c.status === activeTab;
    });
    return list.slice(0, 6);
  }, [certs, activeTab]);

  const activeCertBase = useMemo(() => {
    if (filteredMasterList.length === 0) return null;
    return filteredMasterList.find((c) => c.id === selectedId) || filteredMasterList[0];
  }, [filteredMasterList, selectedId]);

  // Hydrate full detail for the currently selected certificate (cached per id)
  useEffect(() => {
    const id = activeCertBase?.id;
    if (!id || detailCacheRef.current[id]) return;

    let alive = true;
    certificateApi
      .getCertificateById(id)
      .then((res) => {
        if (!alive || !res?.success || !res.data) return;
        detailCacheRef.current[id] = res.data;
        setDetailById((prev) => ({ ...prev, [id]: res.data }));
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [activeCertBase?.id]);

  const activeCert = useMemo(() => {
    if (!activeCertBase) return null;
    const extra = detailById[activeCertBase.id];
    return extra ? { ...activeCertBase, ...extra, status: activeCertBase.status, score: activeCertBase.score } : activeCertBase;
  }, [activeCertBase, detailById]);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setSelectedId(null);
  };

  const statusMeta = (status) => {
    switch (status) {
      case "ISSUED_ON_CHAIN":
        return { label: "Hợp lệ", pillBg: "rgba(16, 185, 129, 0.12)", pillColor: "#047857" };
      case "EXPIRED":
        return { label: "Hết hạn", pillBg: "rgba(245, 158, 11, 0.14)", pillColor: "#b45309" };
      case "PENDING":
        return { label: "Chờ duyệt", pillBg: "rgba(245, 158, 11, 0.14)", pillColor: "#b45309" };
      case "READY_TO_MINT":
        return { label: "Sẵn sàng cấp", pillBg: "rgba(2, 132, 199, 0.12)", pillColor: "#0369a1" };
      case "PENDING_RECONCILE":
        return { label: "Chờ đối soát", pillBg: "rgba(234, 88, 12, 0.14)", pillColor: "#c2410c" };
      case "REVOKED":
        return { label: "Đã thu hồi", pillBg: "rgba(239, 68, 68, 0.12)", pillColor: "#b91c1c" };
      case "REJECTED":
        return { label: "Từ chối", pillBg: "rgba(239, 68, 68, 0.12)", pillColor: "#b91c1c" };
      default:
        return { label: status || "Mới", pillBg: "rgba(15, 39, 60, 0.08)", pillColor: "#475569" };
    }
  };

  const getDigitalIdentityDisplay = (cert) => {
    const hasToken = cert.token_id !== null && cert.token_id !== undefined && cert.token_id !== "";
    if (hasToken) {
      return {
        title: `Token #${cert.token_id}`,
        subtitle: cert.tx_hash ? shortenAddress(cert.tx_hash) : "Đã ghi nhận on-chain"
      };
    }
    if (cert.status === "REJECTED") {
      return { title: "Đã từ chối duyệt", subtitle: "Không phát hành on-chain" };
    }
    if (cert.status === "PENDING_RECONCILE") {
      return { title: "Chờ đối soát", subtitle: "Đã mint, chờ đồng bộ DB" };
    }
    if (cert.status === "READY_TO_MINT") {
      return { title: "Sẵn sàng ký cấp", subtitle: "Đã tạo PDF & lưu IPFS" };
    }
    return { title: "Chưa phát hành", subtitle: "Đang chờ Admin phê duyệt" };
  };

  const hasSubScores = (cert) =>
    Boolean(
      cert?.score_listening ||
      cert?.score_reading ||
      cert?.score_writing ||
      cert?.score_speaking
    );

  const isActiveCertToeic = activeCert
    ? detectCourseType(activeCert.course_code, activeCert.score_type) === "TOEIC"
    : false;

  const canDownloadOrVerify =
    activeCert &&
    (activeCert.status === "ISSUED_ON_CHAIN" ||
      activeCert.status === "EXPIRED" ||
      activeCert.status === "REVOKED");

  const tabItems = [
    { id: "ALL", label: "Tất cả", count: totalCount },
    { id: "PENDING", label: "Chờ duyệt", count: pendingCount },
    { id: "ISSUED_ON_CHAIN", label: "Hợp lệ", count: issuedCount },
    { id: "REJECTED", label: "Từ chối", count: rejectedCount },
    { id: "REVOKED", label: "Thu hồi", count: revokedCount }
  ];

  return (
    <div>
      {/* Offline / API Error Banner (No silent mock data) */}
      {apiError && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 16px",
            borderRadius: "14px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
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
          <button type="button" onClick={loadDashboardData} className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "12px" }}>
            Thử lại
          </button>
        </div>
      )}

      {/* Page Header Strip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "27px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.6px", lineHeight: 1.2 }}>
            {isAdmin ? "Tổng Quan Quản Trị" : "Tổng Quan Khảo Thí"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13.5px", marginTop: "3px" }}>
            {isAdmin
              ? "Theo dõi trạng thái cấp phát, phê duyệt và đối soát toàn bộ chứng chỉ tại một nơi."
              : "Quản lý hồ sơ điểm thi và theo dõi tiến độ phê duyệt chứng chỉ của trung tâm."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button type="button" onClick={loadDashboardData} className="finnova-icon-circle" title="Làm mới số liệu">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <Link to="/admin/certificates/issue" className="finnova-cta-pill">
            <Plus size={16} />
            {isAdmin ? "Cấp Bằng Mới" : "Soạn Bản Nháp"}
          </Link>
        </div>
      </div>

      {/* 4-Column Bento KPI Metric Strip (100% Real Data, Zero Fake Charts) */}
      <div className="finnova-kpi-grid">
        {/* Card 1: Chờ phê duyệt (Role-aware + Real status breakdown pills) */}
        <Link to="/admin/certificates?status=PENDING" className="finnova-kpi-card">
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Chờ phê duyệt</span>
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#fff1f0", color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <AlertCircle size={15} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>{pendingCount}</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>hồ sơ</span>
            </div>
            <div style={{ fontSize: "11.5px", color: pendingCount > 0 ? "#ef4444" : "#10b981", fontWeight: 600, marginTop: "4px" }}>
              {pendingCount === 0
                ? "Không có hồ sơ tồn đọng"
                : isAdmin
                ? "Cần kiểm tra & ký phát hành"
                : "Đang chờ Quản trị viên duyệt"}
            </div>
          </div>

          {/* Honest real-count breakdown instead of fake rising sparkline */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "14px" }}>
            <div style={{ padding: "8px 10px", borderRadius: "12px", background: "var(--bg-page)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 600 }}>
                {reconcileCount > 0 ? "Chờ đối soát" : "Sẵn sàng cấp"}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}>
                {reconcileCount > 0 ? reconcileCount : readyToMintCount}
              </div>
            </div>
            <div style={{ padding: "8px 10px", borderRadius: "12px", background: "var(--bg-page)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 600 }}>Bị từ chối</div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: rejectedCount > 0 ? "#ef4444" : "var(--text-primary)", marginTop: "2px" }}>
                {rejectedCount}
              </div>
            </div>
          </div>
        </Link>

        {/* Card 2: Đã phát hành (Real 6-Month Bar Chart from actual issue_date) */}
        <Link to="/admin/certificates?status=ISSUED_ON_CHAIN" className="finnova-kpi-card">
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Đã phát hành</span>
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#e0f2fe", color: "#0284c7", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={15} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>{issuedCount}</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>chứng chỉ</span>
            </div>
            <div style={{ fontSize: "11.5px", color: "#0284c7", fontWeight: 600, marginTop: "4px" }}>
              {expiredCount > 0
                ? `${activeIssuedCount} còn hạn • ${expiredCount} hết hạn`
                : "Đang có hiệu lực công khai"}
            </div>
          </div>

          {/* 6-Month Rounded Vertical Mini Bar Chart (Real Data) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "7px", alignItems: "end", height: "54px", marginTop: "12px" }}>
            {monthlyIssuedBars.map((bar) => (
              <div
                key={bar.key}
                title={`${bar.fullLabel}: ${bar.count} chứng chỉ`}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: "4px" }}
              >
                <div style={{
                  width: "100%",
                  maxWidth: "16px",
                  height: `${bar.heightPct}%`,
                  minHeight: bar.count > 0 ? "10px" : "4px",
                  borderRadius: "9999px",
                  background: bar.isPeak
                    ? "linear-gradient(180deg, #0f2940 0%, #24577d 100%)"
                    : bar.count > 0
                    ? "#93c5e6"
                    : "var(--border-subtle)"
                }} />
                <span style={{ fontSize: "9.5px", color: "var(--text-muted)", fontWeight: 600 }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </Link>

        {/* Card 3: Đã thu hồi (Accurate Valid/Revoked math on totalEverIssued) */}
        <Link to="/admin/certificates?status=REVOKED" className="finnova-kpi-card">
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Đã thu hồi</span>
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#e8fafd", color: "#06b6d4", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <XCircle size={15} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>{revokedCount}</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>chứng chỉ</span>
            </div>
            <div style={{ fontSize: "11.5px", color: "#0891b2", fontWeight: 600, marginTop: "4px" }}>
              {totalEverIssued > 0
                ? `Tỉ lệ thu hồi: ${revokeRate}% (${revokedCount}/${totalEverIssued} đã cấp)`
                : "Chưa có chứng chỉ nào phát hành"}
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
              <span>Tỉ lệ còn hiệu lực</span>
              <strong style={{ color: "var(--text-primary)" }}>{validRetentionRate}%</strong>
            </div>
            <div style={{ height: "8px", borderRadius: "9999px", background: "var(--border-subtle)", overflow: "hidden" }}>
              <div style={{
                width: `${validRetentionRate}%`,
                height: "100%",
                borderRadius: "9999px",
                background: "linear-gradient(90deg, #0ea5e9 0%, #14b8a6 100%)",
                transition: "width 0.35s ease"
              }} />
            </div>
          </div>
        </Link>

        {/* Card 4 (Wide): Tổng hồ sơ & Top 3 Exam Channels from courseDistribution (Single clean link) */}
        <div className="finnova-kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#ecfdf5", color: "#10b981", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Award size={15} />
              </span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Tổng hồ sơ kỳ thi</span>
            </div>
            <Link
              to="/admin/certificates"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 12px",
                borderRadius: "9999px",
                background: "#102e44",
                color: "#ffffff",
                fontSize: "11.5px",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              Xem tất cả <ArrowUpRight size={12} />
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>{totalCount}</span>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px", background: "#e0f2fe", color: "#0284c7" }}>
              Toàn hệ thống
            </span>
          </div>

          {/* Top 3 Exam Channels — #1 Largest Highlighted in Executive Deep Sapphire */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${topExamChannels.length}, minmax(0, 1fr))`, gap: "8px" }}>
            {topExamChannels.map((ch, idx) => {
              const isTop = idx === 0 && ch.count > 0;
              return (
                <div
                  key={ch.label}
                  style={
                    isTop
                      ? {
                          padding: "9px 10px",
                          borderRadius: "13px",
                          background: "linear-gradient(135deg, #0f2940 0%, #1c4769 100%)",
                          color: "#ffffff",
                          boxShadow: "0 8px 18px -8px rgba(15, 41, 64, 0.5)"
                        }
                      : {
                          padding: "9px 10px",
                          borderRadius: "13px",
                          background: "var(--bg-page)",
                          border: "1px solid var(--border-subtle)"
                        }
                  }
                >
                  <div style={{ fontSize: "10.5px", opacity: isTop ? 0.85 : 1, color: isTop ? "#ffffff" : "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ch.label}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: isTop ? "#ffffff" : "var(--text-primary)", marginTop: "2px" }}>
                    {ch.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SIGNATURE SHOWSTOPPER: Deep Midnight Master-Detail Container with Complete 5-Tab Bar */}
      <div className="finnova-dark-stage">
        {/* Inverted-Notch Cutout Tab Bar (All counts sum cleanly!) */}
        <div className="finnova-notch-wrap">
          <div className="finnova-notch-bar" role="tablist">
            {tabItems.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`finnova-notch-tab ${isActive ? "is-active" : ""}`}
                >
                  <span>{tab.label}</span>
                  <span className="finnova-notch-count">{tab.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel Title Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
            {activeTab === "PENDING"
              ? "Hồ Sơ Đang Chờ Phê Duyệt"
              : activeTab === "ISSUED_ON_CHAIN"
              ? "Chứng Chỉ Đã Phát Hành"
              : activeTab === "REJECTED"
              ? "Hồ Sơ Bị Từ Chối"
              : activeTab === "REVOKED"
              ? "Chứng Chỉ Đã Thu Hồi"
              : "Hồ Sơ Chứng Chỉ Gần Đây"}
          </h2>

          <Link
            to={activeTab === "ALL" ? "/admin/certificates" : `/admin/certificates?status=${activeTab}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "9999px",
              background: "var(--bg-page)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              fontSize: "12.5px",
              fontWeight: 600,
              textDecoration: "none"
            }}
          >
            Mở bảng đầy đủ <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* 2-Column Master-Detail Split */}
        {loading ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            Đang tải dữ liệu hồ sơ chứng chỉ...
          </div>
        ) : filteredMasterList.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            Không có hồ sơ nào trong trạng thái này.
          </div>
        ) : (
          <div className="finnova-master-detail">
            {/* Left Master List (Clean Airy Porcelain Rows) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredMasterList.map((c) => {
                const isSelected = activeCert?.id === c.id;
                const sm = statusMeta(c.status);
                return (
                  <button
                    key={c.id || c.certificate_code}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`finnova-master-row ${isSelected ? "is-selected" : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: isSelected ? "#0f2940" : "rgba(2, 132, 199, 0.1)",
                        color: isSelected ? "#ffffff" : "#0369a1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "13px",
                        flexShrink: 0
                      }}>
                        {(c.student_name || "K").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.certificate_code}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.student_name} • {formatDateVN(c.issue_date)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: sm.pillBg,
                        color: sm.pillColor
                      }}>
                        {sm.label}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)", minWidth: "56px", textAlign: "right" }}>
                        {c.score}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Hero Detail Card (Indigo-Violet Glassmorphic Card — 100% Real Certificate Context) */}
            {activeCert && (() => {
              const identityInfo = getDigitalIdentityDisplay(activeCert);
              const reasonText =
                activeCert.status === "REJECTED"
                  ? activeCert.rejection_reason
                  : activeCert.status === "REVOKED"
                  ? activeCert.revoke_reason
                  : null;

              return (
                <div className="finnova-detail-hero">
                  <div>
                    {/* Top 3-Column Header Metadata */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", position: "relative", zIndex: 1, marginBottom: "20px" }}>
                      <div>
                        <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.68)", marginBottom: "6px" }}>Chi tiết chứng chỉ</div>
                        <div style={{ fontSize: "17px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.3px", marginBottom: "6px", wordBreak: "break-word" }}>
                          {activeCert.certificate_code}
                        </div>
                        <span style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: "9999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: "rgba(255, 255, 255, 0.18)",
                          color: "#ffffff"
                        }}>
                          {statusMeta(activeCert.status).label}
                        </span>
                      </div>

                      <div>
                        <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.68)", marginBottom: "6px" }}>Kỳ thi / Chương trình</div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", lineHeight: 1.35 }}>
                          {activeCert.course_name}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.7)", marginTop: "3px" }}>
                          {activeCert.course_code}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.68)", marginBottom: "6px" }}>Học viên</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "13px",
                            flexShrink: 0
                          }}>
                            {(activeCert.student_name || "K").charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {activeCert.student_name}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.72)" }}>{activeCert.student_code}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle 4 Frosted Glass Sub-Cards (All 4 show real certificate info!) */}
                    <div className="finnova-detail-tiles">
                      <div className="finnova-glass-tile">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.72)" }}>Kết quả đánh giá</span>
                          <Award size={14} color="rgba(255,255,255,0.7)" />
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff" }}>{activeCert.score}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "3px" }}>Điểm tổng Overall</div>
                      </div>

                      <div className="finnova-glass-tile">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.72)" }}>Ngày cấp bằng</span>
                          <Clock size={14} color="rgba(255,255,255,0.7)" />
                        </div>
                        <div style={{ fontSize: "15.5px", fontWeight: 800, color: "#ffffff" }}>{formatDateVN(activeCert.issue_date)}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "3px" }}>
                          Hạn: {activeCert.expiry_date ? formatDateVN(activeCert.expiry_date) : "Vô thời hạn"}
                        </div>
                      </div>

                      <div className="finnova-glass-tile">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.72)" }}>Trạng thái ký số</span>
                          <Sparkles size={14} color="rgba(255,255,255,0.7)" />
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>
                          {identityInfo.title}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.72)", marginTop: "3px", fontFamily: activeCert.tx_hash ? "monospace" : "inherit" }}>
                          {identityInfo.subtitle}
                        </div>
                      </div>

                      <div className="finnova-glass-tile">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.72)" }}>Điểm kỹ năng</span>
                          <SlidersHorizontal size={13} color="rgba(255,255,255,0.7)" />
                        </div>
                        {hasSubScores(activeCert) ? (
                          isActiveCertToeic ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px" }}>
                              <div><span style={{ opacity: 0.7 }}>L:</span> <strong>{activeCert.score_listening ?? "—"}</strong></div>
                              <div><span style={{ opacity: 0.7 }}>R:</span> <strong>{activeCert.score_reading ?? "—"}</strong></div>
                            </div>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", fontSize: "12px" }}>
                              <div><span style={{ opacity: 0.7 }}>L:</span> <strong>{activeCert.score_listening ?? "—"}</strong></div>
                              <div><span style={{ opacity: 0.7 }}>R:</span> <strong>{activeCert.score_reading ?? "—"}</strong></div>
                              <div><span style={{ opacity: 0.7 }}>W:</span> <strong>{activeCert.score_writing ?? "—"}</strong></div>
                              <div><span style={{ opacity: 0.7 }}>S:</span> <strong>{activeCert.score_speaking ?? "—"}</strong></div>
                            </div>
                          )
                        ) : (
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>Đang tải chi tiết...</div>
                        )}
                      </div>
                    </div>

                    {/* Rejection / Revocation Reason Banner when applicable */}
                    {reasonText && (
                      <div style={{
                        position: "relative",
                        zIndex: 1,
                        marginBottom: "18px",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "rgba(239, 68, 68, 0.2)",
                        border: "1px solid rgba(252, 165, 165, 0.35)",
                        fontSize: "12.5px",
                        color: "#fee2e2",
                        lineHeight: 1.45
                      }}>
                        <strong>{activeCert.status === "REJECTED" ? "Lý do từ chối: " : "Lý do thu hồi: "}</strong>
                        {reasonText}
                      </div>
                    )}
                  </div>

                  {/* Bottom Contextual Footer (Zero duplicate Student Code / Status!) */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                    paddingTop: "16px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.14)",
                    position: "relative",
                    zIndex: 1
                  }}>
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", minWidth: 0 }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>Ví nhận chứng chỉ</div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginTop: "2px", fontFamily: "monospace" }}>
                          {activeCert.student_wallet ? shortenAddress(activeCert.student_wallet) : "Chưa gán ví"}
                        </div>
                      </div>
                      {activeCert.ipfs_hash && (
                        <div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>Lưu trữ IPFS</div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginTop: "2px", fontFamily: "monospace" }}>
                            {activeCert.ipfs_hash.slice(0, 12)}...
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      {canDownloadOrVerify && (
                        <>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await certificateApi.openCertificatePdf(activeCert.certificate_code);
                              } catch (err) {
                                toast.error(err.message || "Không thể tải file PDF chứng chỉ từ IPFS.");
                              }
                            }}
                            title="Tải PDF chứng chỉ"
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              border: "1px solid rgba(255,255,255,0.22)",
                              background: "rgba(255,255,255,0.12)",
                              color: "#ffffff",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer"
                            }}
                          >
                            <Download size={16} />
                          </button>
                          <a
                            href={`/verify?code=${activeCert.certificate_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Mở trang tra cứu công khai"
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              border: "1px solid rgba(255,255,255,0.22)",
                              background: "rgba(255,255,255,0.12)",
                              color: "#ffffff",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <ExternalLink size={16} />
                          </a>
                        </>
                      )}

                      {isAdmin && activeCert.status === "PENDING_RECONCILE" ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/certificates/issue?code=${activeCert.certificate_code}`)}
                          className="finnova-white-cta"
                        >
                          <RefreshCw size={15} color="#f97316" />
                          Đối Soát Giao Dịch
                        </button>
                      ) : isAdmin && (activeCert.status === "PENDING" || activeCert.status === "READY_TO_MINT") ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/certificates/issue?code=${activeCert.certificate_code}`)}
                          className="finnova-white-cta"
                        >
                          <Sparkles size={15} color="#0284c7" />
                          Duyệt &amp; Ký Cấp Ngay
                        </button>
                      ) : !isAdmin && activeCert.status === "REJECTED" ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin/certificates/issue?student=${encodeURIComponent(activeCert.student_code || "")}&course=${encodeURIComponent(activeCert.course_code || "")}`
                            )
                          }
                          className="finnova-white-cta"
                        >
                          <FileText size={15} color="#0284c7" />
                          Soạn Lại Hồ Sơ
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/certificates?status=${activeCert.status}`)}
                          className="finnova-white-cta"
                        >
                          Xem Trong Danh Sách
                          <ArrowUpRight size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Audit Logs Vertical Activity Timeline (Clean Executive Feed) */}
      {auditLogs.length > 0 && (
        <div className="finnova-kpi-card" style={{ marginTop: "22px", padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(2, 132, 199, 0.1)", color: "#0284c7", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <History size={16} />
              </span>
              <div>
                <h3 style={{ fontSize: "15.5px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25 }}>
                  Nhật Ký Thao Tác Gần Đây
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "1px" }}>
                  Theo dõi lịch sử soạn thảo, phê duyệt và phát hành chứng chỉ mới nhất
                </p>
              </div>
            </div>
            <span style={{
              fontSize: "11.5px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              background: "var(--bg-page)",
              border: "1px solid var(--border-subtle)",
              padding: "4px 11px",
              borderRadius: "9999px"
            }}>
              {auditLogs.length} hoạt động mới nhất
            </span>
          </div>

          <div className="activity-feed-list">
            {auditLogs.map((log) => {
              const meta = getAuditLogMeta(log);
              const Icon = meta.icon;
              const actorName = log.actor_name || log.username || "Hệ thống";
              const subtitleParts = [];
              if (log.note) subtitleParts.push(log.note);
              else if (log.student_name) subtitleParts.push(`Học viên: ${log.student_name}`);

              return (
                <div key={log.id} className="activity-feed-row">
                  {/* Semantic Action Icon Dot */}
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: meta.iconBg,
                    color: meta.iconColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 1
                  }}>
                    <Icon size={16} />
                  </div>

                  {/* Clean Title + Code Pill + Single-Line Subtitle */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {meta.title}
                      </span>
                      {log.certificate_code && (
                        <code style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          background: "rgba(15, 39, 60, 0.06)",
                          color: "var(--text-primary)",
                          fontWeight: 700,
                          letterSpacing: "0.2px"
                        }}>
                          {log.certificate_code}
                        </code>
                      )}
                      {log.student_name && !String(log.note || "").includes(log.student_name) && (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                          • {log.student_name}
                        </span>
                      )}
                    </div>
                    {subtitleParts.length > 0 && (
                      <div style={{
                        fontSize: "12.5px",
                        color: "var(--text-secondary)",
                        marginTop: "2px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {subtitleParts.join(" • ")}
                      </div>
                    )}
                  </div>

                  {/* Right-Aligned Actor & Clean Timestamp */}
                  <div className="activity-feed-meta" style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                      <span style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "rgba(2, 132, 199, 0.12)",
                        color: "#0369a1",
                        fontSize: "10px",
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {actorName.charAt(0).toUpperCase()}
                      </span>
                      <span>{actorName}</span>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>
                      {formatTimeVN(log.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
