// ================================================================
// DỊCH VỤ GỌI API BACKEND THẬT (RESTful API & MySQL Database)
// Đồng bộ 100% với backend/src/app.js & DANH_SACH_CHUC_NANG_GIAO_DIEN.md
// ================================================================

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Hàm gọi API lõi với tự động đính kèm JWT Token và xử lý lỗi
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("certchain_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Lỗi yêu cầu API (${response.status})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// 1. TÀI KHOẢN & XÁC THỰC (PAGE-004)
export const authApi = {
  login: async (username, password) => {
    const res = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    if (res.success && res.data?.token) {
      localStorage.setItem("certchain_token", res.data.token);
      localStorage.setItem("certchain_user", JSON.stringify(res.data.user));
    }
    return res.data;
  },
  getProfile: async () => {
    return await apiRequest("/auth/profile");
  },
  logout: () => {
    localStorage.removeItem("certchain_token");
    localStorage.removeItem("certchain_user");
  }
};

// 2. THỐNG KÊ DASHBOARD & BÁO CÁO (PAGE-001 & PAGE-005)
export const dashboardApi = {
  getOverviewStats: async () => {
    return await apiRequest("/stats/overview");
  },
  getDashboardStats: async () => {
    return await apiRequest("/dashboard/stats");
  },
  getAuditLogs: async (limit = 20) => {
    return await apiRequest(`/dashboard/logs?limit=${limit}`);
  }
};

// 3. QUẢN LÝ CHỨNG CHỈ (PAGE-002, PAGE-006, PAGE-007)
export const certificateApi = {
  // Tra cứu công khai (không cần login)
  verifyPublic: async (code) => {
    return await apiRequest(`/public/verify/${encodeURIComponent(code)}`);
  },
  // Tra cứu toàn bộ chứng chỉ theo địa chỉ ví học viên (Web3 Student Wallet - Phương án 1)
  getPublicByWallet: async (address) => {
    return await apiRequest(`/public/wallet/${encodeURIComponent(address)}`);
  },
  // Lấy danh sách chứng chỉ nội bộ
  getCertificates: async ({ page = 1, limit = 50, status = "ALL", search = "", course_id } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    if (status && status !== "ALL") params.append("status", status);
    if (search) params.append("search", search);
    if (course_id) params.append("course_id", course_id);
    return await apiRequest(`/certificates?${params.toString()}`);
  },
  getCertificateById: async (id) => {
    return await apiRequest(`/certificates/${id}`);
  },
  // Soạn bản nháp
  createDraft: async (payload) => {
    return await apiRequest("/certificates/draft", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  // Chuẩn bị đúc on-chain (IPFS metadata)
  prepareMint: async (certificate_id) => {
    return await apiRequest("/certificates/prepare-mint", {
      method: "POST",
      body: JSON.stringify({ certificate_id })
    });
  },
  // Xác nhận đã ký ví MetaMask đúc on-chain
  confirmMint: async ({ certificate_id, tx_hash, token_id }) => {
    return await apiRequest("/certificates/confirm-mint", {
      method: "POST",
      body: JSON.stringify({ certificate_id, tx_hash, token_id })
    });
  },
  // Thu hồi chứng chỉ (gửi kèm revoke_tx_hash để Backend xác minh on-chain)
  revokeCertificate: async (id, reason, revoke_tx_hash = null) => {
    return await apiRequest(`/certificates/${id}/revoke`, {
      method: "POST",
      body: JSON.stringify({ reason, revoke_tx_hash })
    });
  },
  // Từ chối bản nháp (ADMIN)
  rejectDraft: async (id, reject_reason) => {
    return await apiRequest(`/certificates/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reject_reason })
    });
  },
  // Đối soát On-Chain (Reconciliation)
  reconcile: async (id) => {
    return await apiRequest(`/certificates/${id}/reconcile`, {
      method: "POST"
    });
  },
  // Xóa bản nháp chứng chỉ
  deleteCertificate: async (id) => {
    return await apiRequest(`/certificates/${id}`, {
      method: "DELETE"
    });
  },
  // Tải & mở file PDF an toàn (kiểm tra HTTP/Content-Type trước để không văng tab JSON lỗi)
  openCertificatePdf: async (certificateCode) => {
    if (!certificateCode) {
      throw new Error("Thiếu mã chứng chỉ để tải PDF.");
    }
    const pdfEndpoint = `${API_BASE_URL}/public/pdf/${encodeURIComponent(certificateCode)}`;
    const response = await fetch(pdfEndpoint);
    const contentType = (response.headers.get("content-type") || "").toLowerCase();

    if (!response.ok || !contentType.includes("application/pdf")) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData.message || `Không thể tải file PDF chứng chỉ (HTTP ${response.status}).`
      );
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, "_blank");
    if (!win) {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${certificateCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  }
};

// 4. QUẢN LÝ HỌC VIÊN & KHÓA HỌC (PAGE-008)
export const studentApi = {
  getStudents: async (search = "") => {
    const endpoint = search ? `/students?search=${encodeURIComponent(search)}` : "/students";
    return await apiRequest(endpoint);
  },
  createStudent: async (studentData) => {
    return await apiRequest("/students", {
      method: "POST",
      body: JSON.stringify(studentData)
    });
  },
  updateStudent: async (id, studentData) => {
    return await apiRequest(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(studentData)
    });
  }
};

export const courseApi = {
  getCourses: async () => {
    return await apiRequest("/courses");
  },
  createCourse: async (courseData) => {
    return await apiRequest("/courses", {
      method: "POST",
      body: JSON.stringify(courseData)
    });
  }
};

