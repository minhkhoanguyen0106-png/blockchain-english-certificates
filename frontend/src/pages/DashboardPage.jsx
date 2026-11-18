import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  FilePlus,
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
  Sparkles
} from "lucide-react";
import { getAllCertificates, shortenAddress } from "../services/web3Service";
import { dashboardApi, certificateApi } from "../services/apiService";

export default function DashboardPage({ user }) {
  const navigate = useNavigate();
  const [certs, setCerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | PENDING | ISSUED_ON_CHAIN | REVOKED
  const [selectedId, setSelectedId] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, certsRes, logsRes] = await Promise.allSettled([
        dashboardApi.getDashboardStats(),
        certificateApi.getCertificates({ limit: 50, status: "ALL" }),
        dashboardApi.getAuditLogs(6)
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.success) {
        setStats(statsRes.value.data);
      }

      if (certsRes.status === "fulfilled" && certsRes.value?.success && Array.isArray(certsRes.value.data)) {
        const mapped = certsRes.value.data.map((d) => ({
          ...d,
          score: d.score_overall || d.score || "—",
          issue_date: d.issue_date ? String(d.issue_date).slice(0, 10) : "",
          expiry_date: d.expiry_date ? String(d.expiry_date).slice(0, 10) : ""
        }));
        setCerts(mapped);
        if (mapped.length > 0) setSelectedId((prev) => prev || mapped[0].id);
      } else {
        const fallback = getAllCertificates();
        setCerts(fallback);
        if (fallback.length > 0) setSelectedId((prev) => prev || fallback[0].id);
      }

      if (logsRes.status === "fulfilled" && logsRes.value?.success && Array.isArray(logsRes.value.data)) {
        setAuditLogs(logsRes.value.data);
      }
    } catch {
      const fallback = getAllCertificates();
      setCerts(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalCount = stats ? Number(stats.totalCertificates) : certs.length;
  const issuedCount = stats ? Number(stats.issuedCount) : certs.filter((c) => c.status === "ISSUED_ON_CHAIN").length;
  const revokedCount = stats ? Number(stats.revokedCount) : certs.filter((c) => c.status === "REVOKED").length;
  const pendingCount = stats
    ? Number(stats.pendingCount) + Number(stats.readyToMintCount || 0)
    : certs.filter((c) => c.status === "PENDING" || c.status === "READY_TO_MINT").length;

  const filteredMasterList = useMemo(() => {
    const list = certs.filter((c) => {
      if (activeTab === "ALL") return true;
      if (activeTab === "PENDING") return c.status === "PENDING" || c.status === "READY_TO_MINT";
      return c.status === activeTab;
    });
    return list.slice(0, 6);
  }, [certs, activeTab]);

  const activeCert = useMemo(() => {
    if (filteredMasterList.length === 0) return null;
    return filteredMasterList.find((c) => c.id === selectedId) || filteredMasterList[0];
  }, [filteredMasterList, selectedId]);

  // Exam breakdown for Wide Card 4
  const examCounts = useMemo(() => {
    const ielts = certs.filter((c) => (c.course_code || "").toUpperCase().includes("IELTS")).length;
    const toeic = certs.filter((c) => (c.course_code || "").toUpperCase().includes("TOEIC")).length;
    const vstep = certs.filter((c) => (c.course_code || "").toUpperCase().includes("VSTEP")).length;
    return { ielts, toeic, vstep };
  }, [certs]);

  const statusMeta = (status) => {
    switch (status) {
      case "ISSUED_ON_CHAIN":
        return { label: "Hợp lệ", darkBg: "rgba(16, 185, 129, 0.18)", darkColor: "#34d399" };
      case "PENDING":
        return { label: "Chờ duyệt", darkBg: "rgba(245, 158, 11, 0.18)", darkColor: "#fbbf24" };
      case "READY_TO_MINT":
        return { label: "Sẵn sàng cấp", darkBg: "rgba(56, 189, 248, 0.2)", darkColor: "#38bdf8" };
      case "REVOKED":
        return { label: "Đã thu hồi", darkBg: "rgba(239, 68, 68, 0.2)", darkColor: "#f87171" };
      case "REJECTED":
        return { label: "Từ chối", darkBg: "rgba(239, 68, 68, 0.18)", darkColor: "#fca5a5" };
      default:
        return { label: status || "Mới", darkBg: "rgba(255, 255, 255, 0.12)", darkColor: "#cbd5e1" };
    }
  };

  return (
    <div>
      {/* Page Header Strip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "27px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.6px", lineHeight: 1.2 }}>
            {user?.role === "ADMIN" ? "Tổng Quan Quản Trị" : "Tổng Quan Khảo Thí"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13.5px", marginTop: "3px" }}>
            {user?.role === "ADMIN"
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
            {user?.role === "ADMIN" ? "Cấp Bằng Mới" : "Soạn Bản Nháp"}
          </Link>
        </div>
      </div>

      {/* 4-Column Bento KPI Metric Strip (FINNOVA Architecture) */}
      <div className="finnova-kpi-grid">
        {/* Card 1: Chờ phê duyệt (Coral / Amber alert badge + Sparkline) */}
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
            <div style={{ fontSize: "11.5px", color: "#ef4444", fontWeight: 600, marginTop: "4px" }}>
              {pendingCount > 0 ? "Cần kiểm tra & ký phát hành" : "Không có hồ sơ tồn đọng"}
            </div>
          </div>

          {/* Smooth Curved Sparkline with Hollow Nodes */}
          <svg viewBox="0 0 200 54" fill="none" style={{ width: "100%", height: "48px", marginTop: "12px" }} aria-hidden="true">
            <defs>
              <linearGradient id="sparkIndigo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5b4df7" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#5b4df7" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M6 38 C32 36, 44 18, 72 22 C100 26, 118 34, 142 18 C164 4, 180 14, 194 12 L194 52 L6 52 Z" fill="url(#sparkIndigo)" />
            <path d="M6 38 C32 36, 44 18, 72 22 C100 26, 118 34, 142 18 C164 4, 180 14, 194 12" stroke="#5b4df7" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="72" cy="22" r="3.5" fill="#ffffff" stroke="#5b4df7" strokeWidth="2" />
            <circle cx="142" cy="18" r="3.5" fill="#ffffff" stroke="#5b4df7" strokeWidth="2" />
            <circle cx="194" cy="12" r="3.5" fill="#ffffff" stroke="#5b4df7" strokeWidth="2" />
          </svg>
        </Link>

        {/* Card 2: Đã phát hành (Indigo icon + 6-Column Rounded Vertical Bar Chart) */}
        <Link to="/admin/certificates?status=ISSUED_ON_CHAIN" className="finnova-kpi-card">
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Đã phát hành</span>
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#eef0ff", color: "#5b4df7", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={15} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>{issuedCount}</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>chứng chỉ</span>
            </div>
            <div style={{ fontSize: "11.5px", color: "#5b4df7", fontWeight: 600, marginTop: "4px" }}>
              ↑ Đang có hiệu lực công khai
            </div>
          </div>

          {/* 6-Column Rounded-Pill Vertical Mini Bar Chart */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "7px", alignItems: "end", height: "54px", marginTop: "12px" }}>
            {[
              { lbl: "T7", h: "52%", hi: false },
              { lbl: "T8", h: "78%", hi: true },
              { lbl: "T9", h: "44%", hi: false },
              { lbl: "T10", h: "92%", hi: true },
              { lbl: "T11", h: "64%", hi: false },
              { lbl: "T12", h: "84%", hi: true }
            ].map((bar) => (
              <div key={bar.lbl} style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: "4px" }}>
                <div style={{
                  width: "100%",
                  maxWidth: "16px",
                  height: bar.h,
                  borderRadius: "9999px",
                  background: bar.hi ? "linear-gradient(180deg, #5b4df7 0%, #818cf8 100%)" : "#d9dcfb"
                }} />
                <span style={{ fontSize: "9.5px", color: "var(--text-muted)", fontWeight: 600 }}>{bar.lbl}</span>
              </div>
            ))}
          </div>
        </Link>

        {/* Card 3: Đã thu hồi (Cyan/Rose badge + Integrity Progress) */}
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
              Tỉ lệ hợp lệ: {totalCount > 0 ? Math.round(((totalCount - revokedCount) / totalCount) * 100) : 100}%
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
              <span>Độ tin cậy hồ sơ</span>
              <strong style={{ color: "var(--text-primary)" }}>{totalCount > 0 ? Math.round((issuedCount / totalCount) * 100) : 0}% cấp</strong>
            </div>
            <div style={{ height: "8px", borderRadius: "9999px", background: "#eaebf4", overflow: "hidden" }}>
              <div style={{
                width: `${totalCount > 0 ? Math.max(12, Math.round((issuedCount / totalCount) * 100)) : 0}%`,
                height: "100%",
                borderRadius: "9999px",
                background: "linear-gradient(90deg, #06b6d4 0%, #5b4df7 100%)"
              }} />
            </div>
          </div>
        </Link>

        {/* Card 4 (Wide): Tổng hồ sơ & 3 Mini Exam Channel Cards + Dark Pill CTA */}
        <div className="finnova-kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#ecfdf5", color: "#10b981", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Award size={15} />
              </span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Tổng hồ sơ kỳ thi</span>
            </div>
            <Link to="/admin/certificates" className="finnova-icon-circle" style={{ width: "30px", height: "30px" }} title="Mở danh sách đầy đủ">
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>{totalCount}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px", background: "#eef0ff", color: "#5b4df7" }}>
                Toàn hệ thống
              </span>
            </div>
            <Link
              to="/admin/certificates"
              style={{
                padding: "7px 14px",
                borderRadius: "9999px",
                background: "#151626",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              Xem tất cả
            </Link>
          </div>

          {/* 3 Mini Channel Cards (Middle Highlighted Electric Indigo!) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            <div style={{ padding: "9px 10px", borderRadius: "13px", background: "var(--bg-page)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 600 }}>IELTS</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}>{examCounts.ielts}</div>
            </div>
            <div style={{ padding: "9px 10px", borderRadius: "13px", background: "linear-gradient(135deg, #5b4df7 0%, #6d5ff9 100%)", color: "#ffffff", boxShadow: "0 8px 18px -6px rgba(91, 77, 247, 0.55)" }}>
              <div style={{ fontSize: "10.5px", opacity: 0.82, fontWeight: 600 }}>TOEIC</div>
              <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "2px" }}>{examCounts.toeic}</div>
            </div>
            <div style={{ padding: "9px 10px", borderRadius: "13px", background: "var(--bg-page)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 600 }}>VSTEP</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}>{examCounts.vstep}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SIGNATURE SHOWSTOPPER: Deep Midnight Master-Detail Container with Top-Center Inverted-Notch Tabs */}
      <div className="finnova-dark-stage">
        {/* Inverted-Notch Cutout Tab Bar */}
        <div className="finnova-notch-wrap">
          <div className="finnova-notch-bar" role="tablist">
            {[
              { id: "ALL", label: "Tất cả", count: certs.length },
              { id: "PENDING", label: "Chờ duyệt", count: certs.filter((c) => c.status === "PENDING" || c.status === "READY_TO_MINT").length },
              { id: "ISSUED_ON_CHAIN", label: "Hợp lệ", count: certs.filter((c) => c.status === "ISSUED_ON_CHAIN").length },
              { id: "REVOKED", label: "Thu hồi", count: certs.filter((c) => c.status === "REVOKED").length }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`finnova-notch-tab ${isActive ? "is-active" : ""}`}
                >
                  <span>{tab.label}</span>
                  <span className="finnova-notch-count">{tab.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dark Panel Title Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#ffffff" }}>
            {activeTab === "PENDING"
              ? "Hồ Sơ Đang Chờ Phê Duyệt"
              : activeTab === "ISSUED_ON_CHAIN"
              ? "Chứng Chỉ Đã Phát Hành"
              : activeTab === "REVOKED"
              ? "Chứng Chỉ Đã Thu Hồi"
              : "Hồ Sơ Chứng Chỉ Gần Đây"}
          </h2>

          <Link
            to="/admin/certificates"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "#e2e8f0",
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
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#9fa3b8", fontSize: "14px" }}>
            Đang tải dữ liệu hồ sơ chứng chỉ...
          </div>
        ) : filteredMasterList.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#9fa3b8", fontSize: "14px" }}>
            Không có hồ sơ nào trong trạng thái này.
          </div>
        ) : (
          <div className="finnova-master-detail">
            {/* Left Master List (Stacked Rounded Pill Rows) */}
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
                        background: isSelected ? "rgba(255, 255, 255, 0.22)" : "rgba(91, 77, 247, 0.22)",
                        color: "#ffffff",
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
                        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.certificate_code}
                        </div>
                        <div style={{ fontSize: "11.5px", color: isSelected ? "rgba(255,255,255,0.78)" : "#9fa3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.student_name} • {c.issue_date}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: isSelected ? "#ffffff" : sm.darkBg,
                        color: isSelected ? "#151626" : sm.darkColor
                      }}>
                        {sm.label}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff", minWidth: "56px", textAlign: "right" }}>
                        {c.score}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Hero Detail Card (Indigo-Violet Layered Glassmorphic Card) */}
            {activeCert && (
              <div className="finnova-detail-hero">
                {/* Top 3-Column Header Metadata */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", position: "relative", zIndex: 1, marginBottom: "22px" }}>
                  <div>
                    <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.68)", marginBottom: "6px" }}>Chi tiết chứng chỉ</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.3px", marginBottom: "6px" }}>
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
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>{activeCert.student_name}</div>
                        <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.72)" }}>{activeCert.student_code}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle 4 Frosted Glass Sub-Cards (3 Info Tiles + 1 Dashed Quick-Add Tile) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", position: "relative", zIndex: 1, marginBottom: "22px" }}>
                  <div className="finnova-glass-tile">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.72)" }}>Kết quả đánh giá</span>
                      <ArrowUpRight size={14} color="rgba(255,255,255,0.7)" />
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>{activeCert.score}</div>
                    <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>Điểm tổng Overall</div>
                  </div>

                  <div className="finnova-glass-tile">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.72)" }}>Ngày cấp bằng</span>
                      <Clock size={14} color="rgba(255,255,255,0.7)" />
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff" }}>{activeCert.issue_date || "—"}</div>
                    <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.7)", marginTop: "3px" }}>
                      Hạn: {activeCert.expiry_date || "Vô thời hạn"}
                    </div>
                  </div>

                  <div className="finnova-glass-tile">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.72)" }}>Định danh số</span>
                      <Sparkles size={14} color="rgba(255,255,255,0.7)" />
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff" }}>
                      {activeCert.token_id ? `Token #${activeCert.token_id}` : "Chưa mint"}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.7)", marginTop: "3px", fontFamily: "monospace" }}>
                      {activeCert.tx_hash ? shortenAddress(activeCert.tx_hash) : "Đang chờ ký"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/admin/certificates/issue")}
                    className="finnova-glass-tile-dashed"
                  >
                    <Plus size={18} />
                    <span>{user?.role === "ADMIN" ? "Cấp bằng mới" : "Soạn nháp mới"}</span>
                  </button>
                </div>

                {/* Bottom Summary + High-Contrast Pure-White Pill CTA */}
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
                  <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>Mã học viên</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", marginTop: "2px" }}>{activeCert.student_code}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>Trạng thái</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", marginTop: "2px" }}>{statusMeta(activeCert.status).label}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {(activeCert.status === "ISSUED_ON_CHAIN" || activeCert.status === "REVOKED") && (
                      <>
                        <button
                          type="button"
                          onClick={() => window.open(`http://localhost:5000/api/public/pdf/${activeCert.certificate_code}`, "_blank")}
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

                    {(activeCert.status === "PENDING" || activeCert.status === "READY_TO_MINT") && user?.role === "ADMIN" ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/certificates/issue?code=${activeCert.certificate_code}`)}
                        className="finnova-white-cta"
                      >
                        <Sparkles size={15} color="#5b4df7" />
                        Duyệt &amp; Ký Cấp Ngay
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate("/admin/certificates")}
                        className="finnova-white-cta"
                      >
                        Quản Lý Hồ Sơ
                        <ArrowUpRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audit Logs Timeline Card (Compact Editorial Footer Strip) */}
      {auditLogs.length > 0 && (
        <div className="finnova-kpi-card" style={{ marginTop: "20px", padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#eef0ff", color: "#5b4df7", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <History size={15} />
              </span>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                Nhật Ký Thao Tác Gần Đây
              </h3>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{auditLogs.length} hoạt động mới nhất</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "10px" }}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "11px 14px",
                  background: "var(--bg-page)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "14px",
                  fontSize: "12.5px"
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{log.action_detail || log.action}</div>
                  {log.note && (
                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {log.note}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>
                  <div style={{ fontWeight: 600 }}>{log.actor_name || log.username || "Hệ thống"}</div>
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
