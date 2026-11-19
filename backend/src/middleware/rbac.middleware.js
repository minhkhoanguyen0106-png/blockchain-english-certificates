// Middleware phân quyền Role-Based Access Control (RBAC)

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "AUTHENTICATION_REQUIRED",
        message: "Người dùng chưa xác thực định danh."
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN_INSUFFICIENT_PERMISSIONS",
        message: `Bạn không có quyền thực hiện hành động này. Vai trò hiện tại của bạn là '${req.user.role}', yêu cầu quyền: [${allowedRoles.join(", ")}].`,
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Guard chuyên biệt: Chỉ dành cho Quản trị viên (ADMIN)
export const requireAdmin = authorizeRoles("ADMIN");

// Guard chuyên biệt: Dành cho Cán bộ khảo thí và Quản trị viên (STAFF, ADMIN)
export const requireStaffOrAdmin = authorizeRoles("STAFF", "ADMIN");
