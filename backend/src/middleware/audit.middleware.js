// Hệ thống lưu trữ và ghi nhận nhật ký kiểm toán (Audit Logs)

export const auditLogs = [];

export const recordAuditLog = ({ actionBy, action, targetId = null, note = "", ip = "" }) => {
  const logEntry = {
    id: auditLogs.length + 1,
    timestamp: new Date().toISOString(),
    action_by: actionBy, // { id, username, role }
    action, // 'LOGIN', 'CREATE_DRAFT', 'MINT_BLOCKCHAIN', 'REVOKE', 'UNAUTHORIZED_ATTEMPT'
    target_id: targetId,
    note,
    ip_address: ip
  };

  auditLogs.push(logEntry);
  return logEntry;
};
