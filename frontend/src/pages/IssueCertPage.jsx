import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FileCheck, Sparkles, CheckCircle2, RefreshCw, Download, ExternalLink, AlertTriangle, UploadCloud, ShieldCheck } from "lucide-react";
import { ethers } from "ethers";
import confetti from "canvas-confetti";
import {
  issueCertificateOnChain,
  INITIAL_STUDENTS,
  INITIAL_COURSES,
  connectMetaMask,
  isMetaMaskInstalled,
  ensureCorrectNetwork,
  getCertificateContract,
  getAllCertificates
} from "../services/web3Service";
import { API_BASE_URL, certificateApi, studentApi, courseApi } from "../services/apiService";
import { computeOverallScore, getExpiryDateForCourse, validateSubScores, detectCourseType, getScoreRangeHint, normalizeScoreInput } from "../services/scoreEngine";
import CertificateCard from "../components/CertificateCard";
import { toast } from "../components/ToastContainer";

const PENDING_RECONCILE_KEY = "koheni_pending_reconcile";

function readPendingReconcileMap() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_RECONCILE_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePendingReconcile(record) {
  try {
    const map = readPendingReconcileMap();
    map[record.certificate_code] = record;
    localStorage.setItem(PENDING_RECONCILE_KEY, JSON.stringify(map));
  } catch {}
}

function clearPendingReconcile(certificateCode) {
  try {
    const map = readPendingReconcileMap();
    delete map[certificateCode];
    localStorage.setItem(PENDING_RECONCILE_KEY, JSON.stringify(map));
  } catch {}
}

export default function IssueCertPage({ wallet, setWallet, user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [studentsList, setStudentsList] = useState(INITIAL_STUDENTS);
  const [coursesList, setCoursesList] = useState(INITIAL_COURSES);
  const [pendingDrafts, setPendingDrafts] = useState([]);
  const [selectedDraftCode, setSelectedDraftCode] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

  const [formData, setFormData] = useState({
    certificate_code: `CERT-IELTS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    student_name: "",
    student_code: "",
    email: "",
    wallet_address: "",
    course_code: "IELTS-ACAD",
    course_name: "IELTS Academic Master",
    score: "",
    listening: "",
    reading: "",
    writing: "",
    speaking: "",
    issue_date: todayStr,
    expiry_date: getExpiryDateForCourse("IELTS-ACAD", todayStr),
    status: "DRAFT"
  });

  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [preparedData, setPreparedData] = useState(null);
  const [mintStageLabel, setMintStageLabel] = useState("");
  const [reconcilePending, setReconcilePending] = useState(null);
  const [successCert, setSuccessCert] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);

  const formatDateDisplay = (val) => {
    if (!val) return "—";
    const str = String(val).slice(0, 10);
    const parts = str.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return str;
  };

  const applyDraftFields = (draft, studentsPool = studentsList) => {
    const matchedStudent = studentsPool.find((s) => s.student_code === draft.student_code);
    const pendingMap = readPendingReconcileMap();
    const savedReconcile = pendingMap[draft.certificate_code] || null;
    setReconcilePending(savedReconcile);

    if (draft.ipfs_hash && draft.ipfs_metadata_url) {
      setPreparedData({
        certificate_id: draft.id,
        ipfs_hash: draft.ipfs_hash,
        data_commitment_hash: draft.data_commitment_hash || null,
        token_uri: draft.ipfs_metadata_url
      });
    } else {
      setPreparedData(null);
    }

    setFormData({
      id: draft.id,
      certificate_code: draft.certificate_code,
      student_name: draft.student_name || matchedStudent?.full_name || "",
      student_code: draft.student_code || "",
      email: draft.student_email || draft.email || matchedStudent?.email || "",
      wallet_address: draft.student_wallet || draft.wallet_address || matchedStudent?.wallet_address || "",
      course_code: draft.course_code || "IELTS-ACAD",
      course_name: draft.course_name || "IELTS Academic Master",
      score: draft.score_overall || draft.score || "",
      listening: draft.score_listening ?? draft.listening ?? "",
      reading: draft.score_reading ?? draft.reading ?? "",
      writing: draft.score_writing ?? draft.writing ?? "",
      speaking: draft.score_speaking ?? draft.speaking ?? "",
      issue_date: draft.issue_date ? String(draft.issue_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      expiry_date: draft.expiry_date ? String(draft.expiry_date).slice(0, 10) : "",
      ipfs_hash: draft.ipfs_hash || null,
      status: draft.status === "READY_TO_MINT" || draft.ipfs_hash ? "READY_TO_MINT" : (draft.status || "PENDING")
    });
  };

  const loadDraftIntoForm = async (draft, studentsPool = studentsList) => {
    setSelectedDraftCode(draft.certificate_code);
    applyDraftFields(draft, studentsPool);

    // Gọi API chi tiết GET /api/certificates/:id để lấy đủ 4 điểm thành phần, ví học viên và IPFS CID
    if (draft?.id) {
      try {
        const detailRes = await certificateApi.getCertificateById(draft.id);
        if (detailRes?.success && detailRes.data) {
          applyDraftFields({ ...draft, ...detailRes.data }, studentsPool);
        }
      } catch {
        // Giữ dữ liệu đã map từ danh sách & studentsPool nếu gọi chi tiết lỗi
      }
    }
  };

  const generateCertificateCode = (courseCode, scoreType = "") => {
    const type = detectCourseType(courseCode, scoreType);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `CERT-${type}-${new Date().getFullYear()}-${rand}`;
  };

  const resetFormForNewEntry = (pool = coursesList) => {
    const defaultCourse = pool[0] || {
      course_code: "IELTS-ACAD",
      course_name: "IELTS Academic Master",
      score_type: "IELTS",
      max_score: "9.0"
    };
    const nowStr = new Date().toISOString().slice(0, 10);
    const courseOpts = { scoreType: defaultCourse.score_type || "", maxScore: defaultCourse.max_score || "" };
    setSelectedDraftCode("");
    setSelectedStudentId("");
    setPreparedData(null);
    setReconcilePending(null);
    setFormData({
      certificate_code: generateCertificateCode(defaultCourse.course_code, defaultCourse.score_type),
      student_name: "",
      student_code: "",
      email: "",
      wallet_address: "",
      course_code: defaultCourse.course_code,
      course_name: defaultCourse.course_name,
      score: "",
      listening: "",
      reading: "",
      writing: "",
      speaking: "",
      issue_date: nowStr,
      expiry_date: getExpiryDateForCourse(defaultCourse.course_code, nowStr, courseOpts),
      status: "DRAFT"
    });
  };

  // Load students, courses, and pending/ready-to-mint drafts from MySQL
  useEffect(() => {
    async function loadOptions() {
      try {
        const [stuRes, crsRes, draftRes] = await Promise.allSettled([
          studentApi.getStudents(),
          courseApi.getCourses(),
          certificateApi.getCertificates({ status: "ALL", limit: 100 })
        ]);
        let loadedStudents = INITIAL_STUDENTS;
        let loadedCourses = INITIAL_COURSES;

        if (stuRes.status === "fulfilled" && stuRes.value?.success && Array.isArray(stuRes.value.data) && stuRes.value.data.length > 0) {
          loadedStudents = stuRes.value.data;
          setStudentsList(loadedStudents);
        }
        if (crsRes.status === "fulfilled" && crsRes.value?.success && Array.isArray(crsRes.value.data) && crsRes.value.data.length > 0) {
          loadedCourses = crsRes.value.data;
          setCoursesList(loadedCourses);
        }

        const codeParam = searchParams.get("code");
        const studentParam = searchParams.get("student");
        const courseParam = searchParams.get("course");

        if (draftRes.status === "fulfilled" && draftRes.value?.success && Array.isArray(draftRes.value.data)) {
          const actionables = draftRes.value.data.filter(
            (d) => d.status === "PENDING" || d.status === "READY_TO_MINT" || d.status === "PENDING_RECONCILE"
          );
          setPendingDrafts(actionables);
          if (codeParam) {
            const draft = actionables.find(d => d.certificate_code === codeParam);
            if (draft) {
              await loadDraftIntoForm(draft, loadedStudents);
              return;
            }
          }
        }

        // Hỗ trợ tự điền sẵn Học viên / Khóa học khi chuyển từ trang Quản lý Học viên & Khóa học
        if (studentParam || courseParam) {
          if (user?.role === "ADMIN") setIsManualMode(true);
          const matchedStu = studentParam
            ? loadedStudents.find(s => s.student_code === studentParam)
            : null;
          const matchedCrs = courseParam
            ? loadedCourses.find(c => c.course_code === courseParam)
            : loadedCourses[0];

          if (matchedStu) setSelectedStudentId(matchedStu.id);

          setFormData(prev => {
            const nextCourseCode = matchedCrs ? matchedCrs.course_code : prev.course_code;
            const courseOpts = { scoreType: matchedCrs?.score_type || "", maxScore: matchedCrs?.max_score || "" };
            return {
              ...prev,
              id: undefined,
              certificate_code: generateCertificateCode(nextCourseCode, courseOpts.scoreType),
              student_name: matchedStu ? matchedStu.full_name : prev.student_name,
              student_code: matchedStu ? matchedStu.student_code : prev.student_code,
              email: matchedStu ? (matchedStu.email || "") : prev.email,
              wallet_address: matchedStu ? (matchedStu.wallet_address || "") : prev.wallet_address,
              course_code: nextCourseCode,
              course_name: matchedCrs ? matchedCrs.course_name : prev.course_name,
              expiry_date: getExpiryDateForCourse(nextCourseCode, prev.issue_date, courseOpts)
            };
          });
        } else if (loadedCourses.length > 0) {
          const matchedDefault = loadedCourses.find(c => c.course_code === "IELTS-ACAD") || loadedCourses[0];
          const courseOpts = { scoreType: matchedDefault.score_type || "", maxScore: matchedDefault.max_score || "" };
          setFormData(prev => ({
            ...prev,
            certificate_code: generateCertificateCode(matchedDefault.course_code, courseOpts.scoreType),
            course_code: matchedDefault.course_code,
            course_name: matchedDefault.course_name,
            expiry_date: getExpiryDateForCourse(matchedDefault.course_code, prev.issue_date, courseOpts)
          }));
        }
      } catch {
        // fallback to initial
      }
    }
    loadOptions();
  }, [searchParams]);

  const getCourseOptions = (courseCode, pool = coursesList) => {
    const found = pool.find((c) => c.course_code === courseCode);
    return {
      scoreType: found?.score_type || "",
      maxScore: found?.max_score || ""
    };
  };

  const handleSubScoreChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const courseOpts = getCourseOptions(updated.course_code);
    const overall = computeOverallScore(updated.course_code, {
      listening: field === "listening" ? val : updated.listening,
      reading: field === "reading" ? val : updated.reading,
      writing: field === "writing" ? val : updated.writing,
      speaking: field === "speaking" ? val : updated.speaking
    }, courseOpts);
    updated.score = overall;
    setFormData(updated);
  };

  const handleDateChange = (issueDate) => {
    const expiry = getExpiryDateForCourse(formData.course_code, issueDate, getCourseOptions(formData.course_code));
    setFormData({
      ...formData,
      issue_date: issueDate,
      expiry_date: expiry
    });
  };

  const handleDraftSelect = (e) => {
    const code = e.target.value;
    setSelectedDraftCode(code);
    if (!code) {
      resetFormForNewEntry();
      return;
    }
    const draft = pendingDrafts.find(d => d.certificate_code === code);
    if (draft) {
      loadDraftIntoForm(draft);
      const matchStu = studentsList.find(s => s.student_code === draft.student_code);
      if (matchStu) setSelectedStudentId(matchStu.id);
    }
  };

  const handleStudentSelect = (e) => {
    const studentId = Number(e.target.value);
    setSelectedStudentId(studentId || "");
    const found = studentsList.find(s => s.id === studentId);
    if (found) {
      setFormData(prev => ({
        ...prev,
        student_name: found.full_name,
        student_code: found.student_code,
        email: found.email || "",
        wallet_address: found.wallet_address || ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        student_name: "",
        student_code: "",
        email: "",
        wallet_address: ""
      }));
    }
  };

  const handleRejectDraft = () => {
    if (!selectedDraftCode) {
      toast.warning("Vui lòng chọn hồ sơ nháp cần từ chối.");
      return;
    }
    setRejectReason("Điểm số các kỹ năng chưa chính xác với biên bản chấm thi.");
    setShowRejectModal(true);
  };

  const executeRejectDraft = async () => {
    if (!rejectReason.trim()) {
      toast.warning("Vui lòng nhập lý do từ chối cụ thể.");
      return;
    }

    try {
      setLoading(true);
      const cert = pendingDrafts.find(d => d.certificate_code === selectedDraftCode);
      if (!cert?.id) throw new Error("Không tìm thấy ID của bản nháp.");
      let res;
      try {
        res = await certificateApi.rejectDraft(cert.id, rejectReason.trim());
      } catch (rejectErr) {
        if (rejectErr?.status === 404) {
          res = await certificateApi.deleteCertificate(cert.id);
        } else {
          throw rejectErr;
        }
      }
      if (res?.success) {
        setShowRejectModal(false);
        toast.success(`Đã từ chối bản nháp ${selectedDraftCode} thành công.`);
        navigate("/admin/certificates");
      } else {
        toast.error("Lỗi khi từ chối: " + (res?.message || "Không xác định"));
      }
    } catch (err) {
      toast.error("Lỗi khi từ chối bản nháp: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (e) => {
    const courseCode = e.target.value;
    const found = coursesList.find(c => c.course_code === courseCode);
    if (found) {
      const courseOpts = { scoreType: found.score_type || "", maxScore: found.max_score || "" };
      const nextType = detectCourseType(found.course_code, found.score_type);
      const nextWriting = nextType === "TOEIC" ? "" : formData.writing;
      const nextSpeaking = nextType === "TOEIC" ? "" : formData.speaking;
      const overall = computeOverallScore(found.course_code, {
        listening: formData.listening,
        reading: formData.reading,
        writing: nextWriting,
        speaking: nextSpeaking
      }, courseOpts);
      const expiry = getExpiryDateForCourse(found.course_code, formData.issue_date, courseOpts);
      setFormData(prev => ({
        ...prev,
        certificate_code: !selectedDraftCode
          ? generateCertificateCode(found.course_code, found.score_type)
          : prev.certificate_code,
        course_code: found.course_code,
        course_name: found.course_name,
        writing: nextWriting,
        speaking: nextSpeaking,
        score: overall,
        expiry_date: expiry
      }));
    }
  };

  const syncStudentWalletIfNeeded = async (rawWallet) => {
    const cleanWallet = (rawWallet || "").trim();
    if (!cleanWallet || !ethers.isAddress(cleanWallet.toLowerCase())) {
      throw new Error("Địa chỉ ví học viên không hợp lệ (cần đúng địa chỉ Ethereum 42 ký tự bắt đầu bằng 0x).");
    }
    const checksumWallet = ethers.getAddress(cleanWallet.toLowerCase());
    const matchedStudent = studentsList.find((s) => s.student_code === formData.student_code);
    if (matchedStudent && String(matchedStudent.wallet_address || "").toLowerCase() !== checksumWallet.toLowerCase()) {
      await studentApi.updateStudent(matchedStudent.id, {
        full_name: matchedStudent.full_name,
        email: matchedStudent.email,
        citizen_id: matchedStudent.citizen_id,
        phone: matchedStudent.phone || "",
        date_of_birth: matchedStudent.date_of_birth ? String(matchedStudent.date_of_birth).slice(0, 10) : "2003-05-15",
        wallet_address: checksumWallet
      });
      setStudentsList((prev) =>
        prev.map((s) => (s.id === matchedStudent.id ? { ...s, wallet_address: checksumWallet } : s))
      );
    }
    return checksumWallet;
  };

  const buildNormalizedDraftPayload = () => {
    const cleanCertCode = (formData.certificate_code || "").trim().toUpperCase();
    const courseOpts = getCourseOptions(formData.course_code);
    const isToeic = detectCourseType(formData.course_code, courseOpts.scoreType) === "TOEIC";
    const normL = normalizeScoreInput(formData.listening);
    const normR = normalizeScoreInput(formData.reading);
    const normW = isToeic ? "" : normalizeScoreInput(formData.writing);
    const normS = isToeic ? "" : normalizeScoreInput(formData.speaking);
    const recomputedOverall = computeOverallScore(
      formData.course_code,
      { listening: normL, reading: normR, writing: normW, speaking: normS },
      courseOpts
    );

    return {
      cleanCertCode,
      isToeic,
      recomputedOverall,
      payload: {
        certificate_code: cleanCertCode,
        student_code: formData.student_code,
        course_code: formData.course_code,
        score_overall: recomputedOverall || formData.score,
        score_listening: normL || null,
        score_reading: normR || null,
        score_writing: isToeic ? null : (normW || null),
        score_speaking: isToeic ? null : (normS || null),
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date || null
      }
    };
  };

  const handleIssue = async (e) => {
    e.preventDefault();

    const { cleanCertCode, recomputedOverall, payload } = buildNormalizedDraftPayload();
    if (!cleanCertCode || !/^[A-Z0-9_-]{4,50}$/.test(cleanCertCode)) {
      toast.warning("Mã chứng chỉ không hợp lệ (chỉ gồm chữ in hoa, số, dấu '-' hoặc '_').");
      return;
    }

    if (!formData.student_name || !formData.student_code) {
      toast.warning("Vui lòng chọn học viên từ danh sách hệ thống.");
      return;
    }

    const matchedStudent = studentsList.find((s) => s.student_code === formData.student_code);
    if (!matchedStudent) {
      toast.warning("Học viên chưa tồn tại trong hệ thống. Hãy chọn từ danh sách hoặc thêm mới tại Quản lý Học viên.");
      return;
    }

    if (!formData.issue_date) {
      toast.warning("Vui lòng chọn ngày cấp chứng chỉ.");
      return;
    }

    if (!formData.wallet_address || !ethers.isAddress(formData.wallet_address.trim().toLowerCase())) {
      toast.warning("Địa chỉ ví học viên chưa hợp lệ (cần địa chỉ Ethereum 42 ký tự bắt đầu bằng 0x).");
      return;
    }

    const courseOpts = getCourseOptions(formData.course_code);
    const validation = validateSubScores(formData.course_code, formData, courseOpts);
    if (!validation.isValid) {
      toast.error(`Dữ liệu điểm chưa hợp lệ:\n• ${validation.errors.join("\n• ")}`);
      return;
    }

    if (!recomputedOverall) {
      toast.error("Không thể tính được điểm tổng Overall hợp lệ từ các kỹ năng đã nhập.");
      return;
    }

    if (user?.role === "STAFF") {
      setLoading(true);
      try {
        // Tạo bản nháp trước — tránh ghi đè ví học viên nếu createDraft thất bại (vd: trùng mã 409)
        const result = await certificateApi.createDraft(payload);
        if (!result?.success || !result.data?.id) {
          throw new Error(result?.message || "Máy chủ chưa xác nhận lưu bản nháp.");
        }
        try {
          await syncStudentWalletIfNeeded(formData.wallet_address);
        } catch (walletSyncErr) {
          toast.warning(`Đã lưu nháp ${cleanCertCode}, nhưng chưa đồng bộ được ví học viên: ${walletSyncErr.message || walletSyncErr}`);
        }
        toast.success(`Đã lưu bản nháp ${cleanCertCode}. Hồ sơ đang chờ Quản trị viên kiểm duyệt.`);
        navigate("/admin/certificates");
      } catch (err) {
        toast.error("Lỗi khi lưu bản nháp: " + (err.message || err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (user?.role !== "ADMIN") {
      toast.error("Tài khoản hiện tại không có quyền phát hành chứng chỉ.");
      return;
    }

    // Đồng bộ ví học viên & chuẩn hóa điểm/mã trước khi mở modal ký
    try {
      const syncedWallet = await syncStudentWalletIfNeeded(formData.wallet_address);
      setFormData((prev) => ({
        ...prev,
        certificate_code: cleanCertCode,
        score: recomputedOverall,
        listening: payload.score_listening || "",
        reading: payload.score_reading || "",
        writing: payload.score_writing || "",
        speaking: payload.score_speaking || "",
        wallet_address: syncedWallet
      }));
    } catch (walletErr) {
      toast.error(walletErr.message || "Không thể đồng bộ địa chỉ ví học viên.");
      return;
    }

    // Bật màn hình đối soát thông tin trước khi ký MetaMask
    setShowConfirmModal(true);
  };

  // Bước 1 (ADMIN): Chuẩn bị phát hành -> Tạo PDF + SHA-256 -> Upload PDF & Metadata lên IPFS -> Lưu CID & trạng thái READY_TO_MINT
  const handlePrepareMint = async () => {
    if (user?.role !== "ADMIN") return;
    if (!formData.student_name || !formData.student_code) {
      toast.warning("Vui lòng chọn hồ sơ chứng chỉ trước khi chuẩn bị phát hành.");
      return;
    }
    if (!formData.issue_date) {
      toast.warning("Vui lòng chọn ngày cấp chứng chỉ.");
      return;
    }
    const validation = validateSubScores(formData.course_code, formData, getCourseOptions(formData.course_code));
    if (!validation.isValid) {
      toast.error(`Dữ liệu điểm chưa hợp lệ:\n• ${validation.errors.join("\n• ")}`);
      return;
    }

    setPreparing(true);
    try {
      const syncedWallet = await syncStudentWalletIfNeeded(formData.wallet_address);
      const { cleanCertCode, recomputedOverall, payload } = buildNormalizedDraftPayload();
      let dbCertId = formData.id;
      if (!dbCertId) {
        if (!cleanCertCode || !/^[A-Z0-9_-]{4,50}$/.test(cleanCertCode)) {
          throw new Error("Mã chứng chỉ không hợp lệ (chỉ gồm chữ in hoa, số, dấu '-' hoặc '_').");
        }
        const draftRes = await certificateApi.createDraft(payload);
        if (!draftRes?.success || !draftRes.data?.id) {
          throw new Error(draftRes?.message || "Không thể khởi tạo hồ sơ PENDING trên máy chủ.");
        }
        dbCertId = draftRes.data.id;
      }

      const prepRes = await certificateApi.prepareMint(dbCertId);
      if (!prepRes?.success || !prepRes.data?.ipfs_hash) {
        throw new Error(prepRes?.message || "Không thể tạo PDF, tính SHA-256 hoặc upload IPFS.");
      }

      const nextPrepared = {
        certificate_id: dbCertId,
        ipfs_hash: prepRes.data.ipfs_hash,
        data_commitment_hash: prepRes.data.data_commitment_hash,
        token_uri: prepRes.data.token_uri || prepRes.data.ipfs_metadata_url
      };
      setPreparedData(nextPrepared);
      setFormData((prev) => ({
        ...prev,
        id: dbCertId,
        certificate_code: cleanCertCode,
        score: recomputedOverall || prev.score,
        wallet_address: syncedWallet,
        ipfs_hash: nextPrepared.ipfs_hash,
        status: "READY_TO_MINT"
      }));
      toast.success("Đã tạo PDF + SHA-256 và tải lên IPFS thành công! Hồ sơ chuyển sang READY_TO_MINT.");
    } catch (err) {
      toast.error("Lỗi chuẩn bị phát hành: " + (err.message || err));
    } finally {
      setPreparing(false);
    }
  };

  // Nhánh đối soát lại khi Mint on-chain thành công nhưng Backend xác minh chưa đồng bộ được DB
  const handleRetryReconcile = async () => {
    if (!reconcilePending) return;
    setReconciling(true);
    try {
      const res = await certificateApi.confirmMint({
        certificate_id: reconcilePending.certificate_id,
        tx_hash: reconcilePending.tx_hash,
        token_id: reconcilePending.token_id
      });
      if (!res?.success) {
        throw new Error(res?.message || "Backend vẫn chưa xác minh được giao dịch.");
      }
      clearPendingReconcile(reconcilePending.certificate_code);
      const syncedCert = {
        ...formData,
        id: reconcilePending.certificate_id,
        tx_hash: reconcilePending.tx_hash,
        token_id: reconcilePending.token_id,
        ipfs_hash: preparedData?.ipfs_hash || formData.ipfs_hash,
        status: "ISSUED_ON_CHAIN"
      };
      setReconcilePending(null);
      setSuccessCert(syncedCert);
      toast.success(`Đối soát thành công! Chứng chỉ ${syncedCert.certificate_code} đã chuyển sang ISSUED_ON_CHAIN.`);
    } catch (err) {
      toast.error("Đối soát chưa thành công: " + (err.message || err));
    } finally {
      setReconciling(false);
    }
  };

  const executeMintOnChain = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setMintStageLabel("Đang kết nối ví MetaMask & kiểm tra mạng...");

    try {
      if (!isMetaMaskInstalled()) {
        throw new Error("Hãy kết nối ví MetaMask trước khi phát hành chứng chỉ.");
      }

      let activeWallet = wallet;
      if (!activeWallet?.signer) {
        activeWallet = await connectMetaMask();
      }
      if (!activeWallet?.signer) {
        throw new Error("Không lấy được chữ ký ví MetaMask của Quản trị viên.");
      }
      if (activeWallet && setWallet) {
        setWallet(activeWallet);
      }

      const rawRecipient = (formData.wallet_address || "").trim();
      if (!rawRecipient || !ethers.isAddress(rawRecipient.toLowerCase())) {
        throw new Error("Địa chỉ ví của học viên không hợp lệ (cần địa chỉ Ethereum 42 ký tự).");
      }
      const recipientAddress = ethers.getAddress(rawRecipient.toLowerCase());

      await ensureCorrectNetwork(activeWallet);

      // Bước 1: Đảm bảo đã có dữ liệu chuẩn bị (PDF + SHA-256 + IPFS CID + Metadata URI)
      let currentPrepared = preparedData;
      if (!currentPrepared?.ipfs_hash || !currentPrepared?.data_commitment_hash || !currentPrepared?.token_uri) {
        setMintStageLabel("Bước 1/3: Tạo PDF + SHA-256 & Upload lên IPFS...");
        let dbCertId = formData.id;
        if (!dbCertId) {
          const { payload } = buildNormalizedDraftPayload();
          const draftRes = await certificateApi.createDraft(payload);
          if (!draftRes?.success || !draftRes.data?.id) {
            throw new Error(draftRes?.message || "Không lưu được bản nháp lên máy chủ.");
          }
          dbCertId = draftRes.data.id;
        }
        const prepRes = await certificateApi.prepareMint(dbCertId);
        if (!prepRes?.success || !prepRes.data?.ipfs_hash) {
          throw new Error(prepRes?.message || "Không chuẩn bị được PDF & IPFS metadata.");
        }
        currentPrepared = {
          certificate_id: dbCertId,
          ipfs_hash: prepRes.data.ipfs_hash,
          data_commitment_hash: prepRes.data.data_commitment_hash,
          token_uri: prepRes.data.token_uri || prepRes.data.ipfs_metadata_url
        };
        setPreparedData(currentPrepared);
        setFormData((prev) => ({ ...prev, id: dbCertId, ipfs_hash: currentPrepared.ipfs_hash, status: "READY_TO_MINT" }));
      }

      if (!currentPrepared.data_commitment_hash || !ethers.isHexString(currentPrepared.data_commitment_hash, 32)) {
        throw new Error("Thiếu mã băm SHA-256 hợp lệ của PDF; đã dừng để đảm bảo an toàn.");
      }
      if (!currentPrepared.token_uri?.startsWith("ipfs://")) {
        throw new Error("URI Metadata IPFS không hợp lệ.");
      }

      // Bước 2: ADMIN ký MetaMask -> Smart Contract kiểm tra quyền -> Mint SBT + Event
      setMintStageLabel("Bước 2/3: Đang chờ ADMIN ký MetaMask & Mint SBT on-chain...");
      const contract = getCertificateContract(activeWallet.signer);
      const expiryTimestamp = formData.expiry_date
        ? Math.floor(new Date(formData.expiry_date).getTime() / 1000)
        : 0;

      const tx = await contract.issueCertificate(
        recipientAddress,
        formData.certificate_code,
        formData.student_name,
        formData.student_code,
        formData.course_code,
        formData.course_name,
        formData.score,
        expiryTimestamp,
        currentPrepared.ipfs_hash,
        currentPrepared.data_commitment_hash,
        currentPrepared.token_uri
      );
      const receipt = await tx.wait();
      if (receipt?.status !== 1) {
        throw new Error(`Giao dịch phát hành thất bại trên blockchain (${tx.hash}).`);
      }

      const onchainResult = await contract.verifyByCertificateCode(formData.certificate_code);
      if (!onchainResult?.exists) {
        throw new Error(`Giao dịch ${tx.hash} đã hoàn tất nhưng chưa đọc được Token ID từ Smart Contract.`);
      }
      const tokenId = onchainResult.tokenId.toString();

      // Bước 3: Backend xác minh giao dịch -> ISSUED_ON_CHAIN hoặc Ghi nhận giao dịch chờ đối soát
      setMintStageLabel("Bước 3/3: Backend đang xác minh giao dịch, event & SHA-256 PDF...");
      try {
        await certificateApi.confirmMint({
          certificate_id: currentPrepared.certificate_id,
          tx_hash: tx.hash,
          token_id: tokenId
        });
      } catch (confirmErr) {
        const reconcileRecord = {
          certificate_id: currentPrepared.certificate_id,
          certificate_code: formData.certificate_code,
          tx_hash: tx.hash,
          token_id: tokenId,
          reason: confirmErr.message || "Backend chưa xác minh kịp giao dịch on-chain",
          created_at: new Date().toISOString()
        };
        savePendingReconcile(reconcileRecord);
        setReconcilePending(reconcileRecord);
        toast.warning("Giao dịch đã lên Blockchain nhưng Backend chưa đồng bộ kịp — đã ghi nhận vào hàng chờ đối soát!");
        return;
      }

      clearPendingReconcile(formData.certificate_code);
      const newCert = {
        id: currentPrepared.certificate_id,
        certificate_code: formData.certificate_code,
        data_hash: currentPrepared.data_commitment_hash,
        student_name: formData.student_name,
        student_code: formData.student_code,
        email: formData.email,
        course_name: formData.course_name,
        course_code: formData.course_code,
        score: formData.score,
        listening: formData.listening || "-",
        reading: formData.reading || "-",
        writing: formData.writing || "-",
        speaking: formData.speaking || "-",
        issue_date: formData.issue_date || new Date().toISOString().slice(0, 10),
        expiry_date: formData.expiry_date || null,
        status: "ISSUED_ON_CHAIN",
        wallet_address: recipientAddress,
        token_id: tokenId,
        tx_hash: tx.hash,
        ipfs_hash: currentPrepared.ipfs_hash,
        pdf_url: `${API_BASE_URL}/public/pdf/${formData.certificate_code}`
      };

      try {
        const list = getAllCertificates().filter(c => !(
          (c.status === "PENDING" || c.status === "READY_TO_MINT") &&
          c.certificate_code === formData.certificate_code
        ));
        list.unshift(newCert);
        localStorage.setItem("certchain_certificates", JSON.stringify(list));
      } catch {}

      setSuccessCert(newCert);
      toast.success(`Phát hành thành công chứng chỉ ${newCert.certificate_code}!`);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      toast.error("Lỗi khi xử lý: " + (err.message || err));
    } finally {
      setLoading(false);
      setMintStageLabel("");
    }
  };

  return (
    <div className="admin-page admin-issue">
      {/* Page Title */}
      <div className="admin-page-heading" style={{ marginBottom: "26px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-primary)" }}>
          {user?.role === "ADMIN" ? (
            <>Duyệt &amp; <span className="text-gradient">Cấp Phát Chứng Chỉ Số</span></>
          ) : (
            <>Soạn <span className="text-gradient">Hồ Sơ Nháp Chứng Chỉ</span></>
          )}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          {user?.role === "ADMIN"
            ? "Đối soát hồ sơ khảo thí, ký xác thực và phát hành chứng chỉ điện tử bất biến."
            : "Nhập điểm khảo thí và lập bản nháp chứng chỉ để trình Quản trị viên kiểm duyệt."}
        </p>
      </div>

      {/* 2-Column Split Layout */}
      <div className="issue-split-grid">
        
        {/* Left Column: Input Form */}
        <div className="glass-panel" style={{ padding: "26px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
            <FileCheck size={19} color="var(--primary)" />
            Thông Tin Khảo Thí & Học Viên
          </h3>

          <form onSubmit={handleIssue}>

            {/* CHẾ ĐỘ 1: DÀNH CHO ADMIN DUYỆT HỒ SƠ NHÁP (Mặc định khi là Admin và không ở chế độ thủ công) */}
            {user?.role === "ADMIN" && !isManualMode ? (
              <div>
                {/* 1. Bộ chọn duy nhất: Hồ sơ nháp chờ duyệt */}
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label className="form-label" style={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Chọn hồ sơ nháp chờ phê duyệt</span>
                    {pendingDrafts.length > 0 && (
                      <span className="badge badge-warning" style={{ fontSize: "11px", padding: "2px 8px" }}>
                        {pendingDrafts.length} hồ sơ chờ duyệt
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedDraftCode}
                    onChange={handleDraftSelect}
                    className="form-select"
                  >
                    <option value="">-- Chọn hồ sơ nháp để đối soát & phê duyệt --</option>
                    {pendingDrafts.map(d => (
                      <option key={d.id} value={d.certificate_code}>
                        {d.certificate_code} — {d.student_name} ({d.course_name}: {d.score_overall || d.score})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Thẻ tóm tắt thông tin đối soát gọn gàng (Khi đã chọn hồ sơ nháp) */}
                {formData.student_name ? (
                  <div style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "12px",
                    padding: "18px",
                    marginBottom: "18px",
                    boxShadow: "var(--shadow-sm)"
                  }}>
                    {/* Học viên */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <div>
                        <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>{formData.student_name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Mã HV: <strong style={{ color: "var(--text-primary)" }}>{formData.student_code}</strong>
                          {formData.email && <span> • {formData.email}</span>}
                        </div>
                      </div>
                      <span
                        className={`badge ${reconcilePending ? "badge-warning" : preparedData ? "badge-info" : "badge-warning"}`}
                        style={{ fontSize: "11px" }}
                      >
                        {reconcilePending
                          ? "Chờ đối soát"
                          : preparedData
                          ? "Sẵn sàng ký cấp"
                          : "Chờ duyệt"}
                      </span>
                    </div>

                    {/* Thanh tiến độ 4 bước tinh gọn (Circular Connected Stepper) */}
                    <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px", marginBottom: "18px", paddingTop: "2px" }}>
                      {/* Horizontal Connector Rail */}
                      <div style={{
                        position: "absolute",
                        top: "14px",
                        left: "12.5%",
                        right: "12.5%",
                        height: "2px",
                        background: "var(--border-subtle)",
                        zIndex: 0
                      }}>
                        <div style={{
                          height: "100%",
                          background: "var(--primary)",
                          width: successCert ? "100%" : reconcilePending ? "66%" : preparedData ? "33%" : "0%",
                          transition: "width 0.35s cubic-bezier(0.22, 1, 0.36, 1)"
                        }} />
                      </div>

                      {[
                        { num: 1, label: "Chờ duyệt", done: true, active: !preparedData && !reconcilePending && !successCert },
                        { num: 2, label: "Chuẩn bị IPFS", done: Boolean(preparedData || reconcilePending || successCert), active: Boolean(preparedData && !reconcilePending && !successCert) },
                        { num: 3, label: "Ký MetaMask", done: Boolean(reconcilePending || successCert), active: Boolean(reconcilePending && !successCert) },
                        { num: 4, label: "Phát hành", done: Boolean(successCert), active: Boolean(successCert) }
                      ].map((st) => (
                        <div key={st.num} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
                          <div style={{
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: st.done ? "var(--primary)" : "var(--bg-surface-elevated)",
                            color: st.done ? "#ffffff" : "var(--text-muted)",
                            border: `2px solid ${st.done ? "var(--primary)" : "var(--border-medium)"}`,
                            boxShadow: st.active ? "0 0 0 3px var(--primary-glow)" : "none",
                            transition: "all 0.25s ease"
                          }}>
                            {st.done && !st.active ? "✓" : st.num}
                          </div>
                          <span style={{
                            marginTop: "6px",
                            fontSize: "11px",
                            fontWeight: st.done ? 700 : 500,
                            color: st.done ? "var(--text-primary)" : "var(--text-muted)",
                            textAlign: "center",
                            whiteSpace: "nowrap"
                          }}>
                            {st.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Khối hiển thị bằng chứng IPFS & SHA-256 khi đã ở trạng thái READY_TO_MINT */}
                    {preparedData && (
                      <div style={{
                        background: "rgba(14, 165, 233, 0.08)",
                        border: "1px solid rgba(14, 165, 233, 0.3)",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        marginBottom: "14px",
                        fontSize: "11.5px"
                      }}>
                        <div style={{ fontWeight: 700, color: "var(--primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <ShieldCheck size={14} /> Đã tạo PDF + SHA-256 &amp; Upload IPFS (READY_TO_MINT)
                        </div>
                        <div style={{ color: "var(--text-secondary)", wordBreak: "break-all", lineHeight: 1.5 }}>
                          <div><strong>PDF CID:</strong> <code>{preparedData.ipfs_hash}</code></div>
                          {preparedData.data_commitment_hash && (
                            <div><strong>SHA-256:</strong> <code>{preparedData.data_commitment_hash.slice(0, 26)}...</code></div>
                          )}
                          {preparedData.token_uri && (
                            <div><strong>Metadata:</strong> <code>{preparedData.token_uri}</code></div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Nhánh: Ghi nhận giao dịch chờ đối soát khi Mint xong nhưng Confirm bị lỗi */}
                    {reconcilePending && (
                      <div style={{
                        background: "rgba(245, 158, 11, 0.12)",
                        border: "1px solid rgba(245, 158, 11, 0.45)",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        marginBottom: "14px",
                        fontSize: "12px"
                      }}>
                        <div style={{ fontWeight: 800, color: "var(--warning-text)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <AlertTriangle size={15} /> Giao dịch đã ghi nhận trên mạng — Chờ đối soát
                        </div>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "8px", lineHeight: 1.45 }}>
                          Không bấm ký phát hành lại để tránh tạo trùng token. Hãy bấm đối soát để Backend xác minh lại giao dịch này.
                        </p>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", wordBreak: "break-all", marginBottom: "10px" }}>
                          <div><strong>Tx Hash:</strong> <code>{reconcilePending.tx_hash}</code></div>
                          <div><strong>Token ID:</strong> #{reconcilePending.token_id}</div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRetryReconcile}
                          disabled={reconciling}
                          className="btn btn-primary"
                          style={{ padding: "7px 14px", fontSize: "12px" }}
                        >
                          {reconciling ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                          {reconciling ? "Đang đối soát với Backend..." : "Đối Soát & Xác Minh Lại Ngay"}
                        </button>
                      </div>
                    )}

                    {/* Khóa thi & Điểm */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", marginBottom: "14px" }}>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Kỳ thi / Khóa học</div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formData.course_name}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Điểm tổng (Overall)</div>
                        <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: "15px" }}>{formData.score}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Ngày cấp bằng</div>
                        <div style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{formatDateDisplay(formData.issue_date)}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Hạn hiệu lực</div>
                        <div style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{formData.expiry_date ? formatDateDisplay(formData.expiry_date) : "Vô thời hạn"}</div>
                      </div>
                    </div>

                    {/* Bảng điểm 4 kỹ năng */}
                    <div style={{
                      background: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-subtle)",
                      padding: "12px",
                      borderRadius: "10px",
                      marginBottom: "16px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Điểm 4 kỹ năng thành phần</span>
                        <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <ShieldCheck size={12} /> Đã chốt điểm
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", textAlign: "center" }}>
                        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "8px 4px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Listening</div>
                          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", marginTop: "2px" }}>{formData.listening || "—"}</div>
                        </div>
                        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "8px 4px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Reading</div>
                          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", marginTop: "2px" }}>{formData.reading || "—"}</div>
                        </div>
                        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "8px 4px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Writing</div>
                          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", marginTop: "2px" }}>{formData.writing || "—"}</div>
                        </div>
                        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "8px 4px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Speaking</div>
                          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", marginTop: "2px" }}>{formData.speaking || "—"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Địa chỉ ví nhận NFT */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                        <label className="form-label" style={{ fontSize: "11.5px", marginBottom: 0 }}>
                          Địa chỉ ví nhận chứng chỉ của học viên
                        </label>
                        <span style={{ fontSize: "11px", color: formData.wallet_address ? "var(--success-text)" : "var(--warning-text)", fontWeight: 600 }}>
                          {formData.wallet_address ? "Tự động từ hồ sơ học viên" : "Học viên chưa có ví"}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.wallet_address}
                        onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                        className="form-input"
                        style={{ fontSize: "12px", fontFamily: "monospace" }}
                        placeholder="0x... (tự động điền từ hồ sơ học viên)"
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: "24px 16px",
                    textAlign: "center",
                    border: "1px dashed var(--border-subtle)",
                    borderRadius: "10px",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    marginBottom: "18px"
                  }}>
                    Vui lòng chọn một hồ sơ nháp đang chờ duyệt từ danh sách phía trên để đối soát và ký phê duyệt phát hành.
                  </div>
                )}

                {/* Nút hành động 2 bước: Chuẩn bị phát hành (IPFS) -> Ký MetaMask */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={preparing || loading || !formData.student_name || Boolean(reconcilePending)}
                    onClick={handlePrepareMint}
                    className="btn btn-outline"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      fontSize: "13.5px",
                      borderColor: preparedData ? "rgba(16, 185, 129, 0.45)" : "rgba(14, 165, 233, 0.45)",
                      color: preparedData ? "var(--success-text)" : "var(--primary)"
                    }}
                  >
                    {preparing ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        Đang tạo PDF + SHA-256 &amp; Upload IPFS...
                      </>
                    ) : preparedData ? (
                      <>
                        <CheckCircle2 size={15} />
                        Đã Chuẩn Bị IPFS (READY_TO_MINT) — Tạo Lại Nếu Cần
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        Bước 1: Chuẩn Bị Phát Hành (PDF + SHA-256 + IPFS)
                      </>
                    )}
                  </button>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="submit"
                      disabled={loading || preparing || !formData.student_name || Boolean(reconcilePending)}
                      className="btn btn-gold"
                      style={{ flex: 1, padding: "13px", fontSize: "14px" }}
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          {mintStageLabel || "Đang xử lý phát hành chứng chỉ..."}
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Bước 2: Ký MetaMask &amp; Mint SBT
                        </>
                      )}
                    </button>

                    {selectedDraftCode && !reconcilePending && (
                      <button
                        type="button"
                        disabled={loading || preparing}
                        onClick={handleRejectDraft}
                        className="btn btn-outline"
                        style={{
                          padding: "13px 16px",
                          fontSize: "13px",
                          color: "var(--danger-text)",
                          borderColor: "rgba(239, 68, 68, 0.4)",
                          whiteSpace: "nowrap"
                        }}
                        title="Từ chối bản nháp và ghi nhận lý do (REJECTED)"
                      >
                        Từ Chối Nháp
                      </button>
                    )}
                  </div>
                </div>

                {/* Nút chuyển chế độ thủ công */}
                <div style={{ textAlign: "center", marginTop: "14px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      resetFormForNewEntry();
                      setIsManualMode(true);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    Hoặc tạo mới chứng chỉ thủ công
                  </button>
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ 2: DÀNH CHO CÁN BỘ KHẢO THÍ (STAFF) HOẶC ADMIN NHẬP THỦ CÔNG */
              <div>
                {user?.role === "ADMIN" && isManualMode && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span className="badge badge-info" style={{ fontSize: "11px" }}>Chế độ nhập mới thủ công</span>
                    <button
                      type="button"
                      onClick={() => {
                        resetFormForNewEntry();
                        setIsManualMode(false);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: "12px",
                        cursor: "pointer",
                        textDecoration: "underline"
                      }}
                    >
                      Quay lại duyệt hồ sơ nháp
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Mã chứng chỉ</label>
                    <button
                      type="button"
                      onClick={() => {
                        const opts = getCourseOptions(formData.course_code);
                        setFormData((prev) => ({
                          ...prev,
                          certificate_code: generateCertificateCode(prev.course_code, opts.scoreType)
                        }));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <RefreshCw size={12} /> Tạo mã mới
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={formData.certificate_code}
                    onChange={(e) => setFormData({ ...formData, certificate_code: e.target.value.toUpperCase().replace(/\s+/g, "-") })}
                    className="form-input"
                    style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--primary)" }}
                    placeholder="VD: CERT-IELTS-2026-1024"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Chọn học viên từ danh sách</label>
                  <select required value={selectedStudentId} onChange={handleStudentSelect} className="form-select">
                    <option value="">-- Chọn học viên đã đăng ký trong hệ thống --</option>
                    {studentsList.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Họ tên học viên</label>
                    <input
                      type="text"
                      readOnly
                      placeholder="Tự động điền khi chọn học viên"
                      value={formData.student_name}
                      className="form-input"
                      style={{ opacity: 0.85, cursor: "not-allowed" }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mã học viên</label>
                    <input
                      type="text"
                      readOnly
                      placeholder="Tự động điền..."
                      value={formData.student_code}
                      className="form-input"
                      style={{ opacity: 0.85, cursor: "not-allowed", fontFamily: "monospace" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Khóa học / Kỳ thi tiếng Anh</label>
                  <select value={formData.course_code} onChange={handleCourseSelect} className="form-select">
                    {coursesList.map(c => (
                      <option key={c.course_code} value={c.course_code}>{c.course_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Điểm số Overall</label>
                    <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600 }}>
                      (Tự động tính)
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    placeholder="Chưa có điểm..."
                    value={formData.score}
                    className="form-input"
                    style={{
                      background: "var(--bg-card-subtle, rgba(255,255,255,0.05))",
                      cursor: "not-allowed",
                      fontWeight: 700,
                      color: "var(--primary, #3b82f6)",
                      borderColor: "rgba(59, 130, 246, 0.3)"
                    }}
                  />
                </div>

                {/* Sub-scores 4 skills */}
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <label className="form-label" style={{ fontSize: "12px", marginBottom: 0 }}>
                      Điểm số các kỹ năng thành phần
                    </label>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
                      {getScoreRangeHint(formData.course_code, getCourseOptions(formData.course_code))}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Listening</label>
                      <input
                        type="text"
                        placeholder="—"
                        value={formData.listening}
                        onChange={(e) => handleSubScoreChange("listening", e.target.value)}
                        className="form-input"
                        style={{ padding: "8px 10px", textAlign: "center" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Reading</label>
                      <input
                        type="text"
                        placeholder="—"
                        value={formData.reading}
                        onChange={(e) => handleSubScoreChange("reading", e.target.value)}
                        className="form-input"
                        style={{ padding: "8px 10px", textAlign: "center" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Writing {detectCourseType(formData.course_code, getCourseOptions(formData.course_code).scoreType) === "TOEIC" ? "(N/A)" : ""}
                      </label>
                      <input
                        type="text"
                        disabled={detectCourseType(formData.course_code, getCourseOptions(formData.course_code).scoreType) === "TOEIC"}
                        placeholder={detectCourseType(formData.course_code, getCourseOptions(formData.course_code).scoreType) === "TOEIC" ? "N/A" : "—"}
                        value={formData.writing}
                        onChange={(e) => handleSubScoreChange("writing", e.target.value)}
                        className="form-input"
                        style={{
                          padding: "8px 10px",
                          textAlign: "center",
                          opacity: detectCourseType(formData.course_code, getCourseOptions(formData.course_code).scoreType) === "TOEIC" ? 0.45 : 1,
                          cursor: detectCourseType(formData.course_code, getCourseOptions(formData.course_code).scoreType) === "TOEIC" ? "not-allowed" : "text"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Speaking {detectCourseType(formData.course_code, getCourseOptions(formData.course_code).scoreType) === "TOEIC" ? "(N/A)" : ""}
                      </label>
                      <input
                        type="text"
                        disabled={detectCourseType(formData.course_code, getCourseOptions(formData.course_code).scoreType) === "TOEIC"}
                        placeholder={detectCourseType(formData.course_code, getCourseOptions(formData.course_code).scoreType) === "TOEIC" ? "N/A" : "—"}
                        value={formData.speaking}
                        onChange={(e) => handleSubScoreChange("speaking", e.target.value)}
                        className="form-input"
                        style={{
                          padding: "8px 10px",
                          textAlign: "center",
                          opacity: detectCourseType(formData.course_code, getCourseOptions(formData.course_code).scoreType) === "TOEIC" ? 0.45 : 1,
                          cursor: detectCourseType(formData.course_code, getCourseOptions(formData.course_code).scoreType) === "TOEIC" ? "not-allowed" : "text"
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Ngày cấp chứng chỉ / hạn hiệu lực */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label className="form-label" style={{ fontSize: "12px" }}>Ngày cấp chứng chỉ</label>
                    <input
                      type="date"
                      required
                      value={formData.issue_date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: "12px" }}>
                      Hạn hiệu lực
                    </label>
                    <input
                      type={formData.expiry_date ? "date" : "text"}
                      readOnly
                      value={formData.expiry_date || "Vô thời hạn (Vĩnh viễn)"}
                      className="form-input"
                      style={{ opacity: 0.85 }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Địa chỉ ví điện tử học viên</label>
                  <input
                    type="text"
                    placeholder="0x... (Địa chỉ ví điện tử học viên)"
                    value={formData.wallet_address}
                    onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                    className="form-input"
                    style={{ fontSize: "12px" }}
                  />
                </div>

                {/* Nút lưu hoặc phát hành */}
                {user?.role === "STAFF" ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "14px", fontSize: "15px" }}
                  >
                    {loading ? "Đang lưu hệ thống..." : "Lưu Bản Nháp (Gửi Admin Duyệt)"}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !formData.student_name}
                    className="btn btn-gold"
                    style={{ width: "100%", padding: "14px", fontSize: "15px" }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Đang xử lý phát hành...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Ký Xác Thực & Cấp Bằng
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

          </form>
        </div>

        {/* Right Column: Live Certificate Preview */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>
              XEM TRƯỚC PHÔI BẰNG THỜI GIAN THỰC (LIVE PREVIEW)
            </span>
            <span className="badge badge-info">Tự động đồng bộ</span>
          </div>

          <CertificateCard cert={formData} isPreview={true} />
        </div>

      </div>

      {/* Confirmation & Pre-mint Review Modal (Admin Four-Eyes Check) */}
      {showConfirmModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "var(--bg-modal-backdrop)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 998,
          padding: "20px"
        }}>
          <div className="glass-panel" style={{
            maxWidth: "560px",
            width: "100%",
            padding: "28px 32px",
            background: "var(--bg-surface-elevated)",
            borderRadius: "16px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)"
          }}>
            <h3 style={{ fontSize: "19px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} color="var(--primary)" /> Đối Soát Dữ Liệu Trước Khi Ký Phát Hành
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "18px" }}>
              Vui lòng kiểm tra kỹ lưỡng các thông số hồ sơ do Nhân viên Khảo thí lập trước khi kích hoạt giao dịch ký số.
            </p>

            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "16px",
              fontSize: "13px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "18px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Mã chứng chỉ:</span>
                <strong style={{ color: "var(--primary)" }}>{formData.certificate_code}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Học viên:</span>
                <strong>{formData.student_name} ({formData.student_code})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Kỳ thi / Chứng chỉ:</span>
                <span style={{ color: "var(--accent-gold)", fontWeight: 600 }}>{formData.course_name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Điểm thành phần:</span>
                <span>
                  {detectCourseType(formData.course_code, getCourseOptions(formData.course_code).scoreType) === "TOEIC"
                    ? `L: ${formData.listening || "—"} • R: ${formData.reading || "—"}`
                    : `L: ${formData.listening || "—"} • R: ${formData.reading || "—"} • W: ${formData.writing || "—"} • S: ${formData.speaking || "—"}`}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Điểm Overall:</span>
                <strong style={{ color: "var(--success-text)", fontSize: "15px" }}>{formData.score}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Ngày cấp & Hiệu lực:</span>
                <span>{formatDateDisplay(formData.issue_date)} (Hạn: {formData.expiry_date ? formatDateDisplay(formData.expiry_date) : "Vô thời hạn"})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)" }}>Địa chỉ ví định danh:</span>
                <code style={{ fontSize: "11px", color: "#38bdf8", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>
                  {formData.wallet_address}
                </code>
              </div>
              {preparedData?.ipfs_hash && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>PDF IPFS CID:</span>
                  <code style={{ fontSize: "11px", color: "#10b981", background: "rgba(0,0,0,0.25)", padding: "2px 6px", borderRadius: "4px" }}>
                    {preparedData.ipfs_hash.slice(0, 22)}...
                  </code>
                </div>
              )}
              {preparedData?.data_commitment_hash && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>SHA-256 PDF:</span>
                  <code style={{ fontSize: "11px", color: "#f59e0b", background: "rgba(0,0,0,0.25)", padding: "2px 6px", borderRadius: "4px" }}>
                    {preparedData.data_commitment_hash.slice(0, 22)}...
                  </code>
                </div>
              )}
            </div>

            <div style={{
              background: "var(--warning-bg)",
              border: "1px solid rgba(217, 119, 6, 0.28)",
              borderRadius: "10px",
              padding: "11px 14px",
              fontSize: "12.5px",
              color: "var(--warning-text)",
              marginBottom: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px"
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span><strong>Lưu ý:</strong> Sau khi ký xác thực, chứng chỉ sẽ được cấp chính thức và không thể chỉnh sửa điểm số.</span>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-outline"
                style={{ padding: "10px 18px", fontSize: "13px" }}
              >
                Hủy Bỏ / Kiểm Tra Lại
              </button>
              <button
                type="button"
                onClick={executeMintOnChain}
                className="btn btn-gold"
                style={{ padding: "10px 22px", fontSize: "13px", fontWeight: 700 }}
              >
                Xác Nhận & Ký Phát Hành
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Draft Modal (Thay thế prompt() thô của trình duyệt) */}
      {showRejectModal && (
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
          <div className="glass-panel" style={{ maxWidth: "480px", width: "100%", padding: "28px", background: "var(--bg-surface-elevated)", borderColor: "rgba(239, 68, 68, 0.35)" }}>
            <h3 style={{ fontSize: "19px", fontWeight: 800, color: "var(--danger-text)", marginBottom: "8px" }}>
              Từ Chối Hồ Sơ Nháp
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Hồ sơ <strong>{selectedDraftCode}</strong> sẽ bị hủy duyệt và trả về cho Cán bộ khảo thí rà soát lại.
            </p>
            <div className="form-group">
              <label className="form-label">Lý do từ chối</label>
              <textarea
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="form-textarea"
                placeholder="Nhập lý do cụ thể..."
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button type="button" onClick={() => setShowRejectModal(false)} className="btn btn-outline">Hủy</button>
              <button type="button" onClick={executeRejectDraft} disabled={loading} className="btn btn-danger">
                {loading ? "Đang xử lý..." : "Xác Nhận Từ Chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successCert && (
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
            maxWidth: "520px",
            width: "100%",
            padding: "36px",
            textAlign: "center",
            background: "var(--bg-surface-elevated)"
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "var(--success-bg)",
              color: "var(--success-color)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px"
            }}>
              <CheckCircle2 size={36} color="var(--success-color)" />
            </div>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "var(--success-text)", marginBottom: "8px" }}>
              Phát Hành Chứng Chỉ Số Thành Công!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
              Chứng chỉ <strong>{successCert.certificate_code}</strong> đã được xác thực và lưu trữ thành công trên hệ thống.
            </p>

            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "var(--radius-md)", fontSize: "12px", textAlign: "left", marginBottom: "24px" }}>
              <div><strong>Mã giao dịch xác thực:</strong> <span style={{ color: "var(--primary)" }}>{successCert.tx_hash}</span></div>
              <div style={{ marginTop: "4px" }}><strong>Mã số bằng:</strong> <span style={{ color: "var(--accent-gold)" }}>#{successCert.token_id}</span></div>
              <div style={{ marginTop: "4px" }}><strong>Mã lưu trữ số:</strong> <span style={{ color: "var(--accent-gold)" }}>{successCert.ipfs_hash}</span></div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => { setSuccessCert(null); navigate("/admin/certificates"); }}
                className="btn btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <CheckCircle2 size={16} /> Về Danh Sách Chứng Chỉ
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await certificateApi.openCertificatePdf(successCert.certificate_code);
                  } catch (err) {
                    toast.error(err.message || "Không thể tải file PDF chứng chỉ từ IPFS.");
                  }
                }}
                className="btn btn-gold"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Download size={15} /> Tải PDF Thật
              </button>
              <a
                href={`/verify?code=${successCert.certificate_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <ExternalLink size={14} /> Mở Trang Tra Cứu (Tab Mới)
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
