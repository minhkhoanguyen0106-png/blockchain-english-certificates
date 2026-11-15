// ================================================================
// ENGINE TÍNH ĐIỂM & QUY TẮC HIỆU LỰC CHỨNG CHỈ (v2.0)
// Hỗ trợ: IELTS, TOEIC (L&R, S&W), VSTEP, CAMBRIDGE, TOEFL
// ================================================================

export const CERTIFICATE_TYPES = {
  IELTS: "IELTS",
  TOEIC: "TOEIC",
  VSTEP: "VSTEP",
  CAMBRIDGE: "CAMBRIDGE",
  TOEFL: "TOEFL"
};

/**
 * Nhận diện loại chứng chỉ dựa vào course_code
 */
export function detectCourseType(courseCode = "") {
  const code = (courseCode || "").toUpperCase();
  if (code.includes("IELTS")) return CERTIFICATE_TYPES.IELTS;
  if (code.includes("TOEIC")) return CERTIFICATE_TYPES.TOEIC;
  if (code.includes("VSTEP")) return CERTIFICATE_TYPES.VSTEP;
  if (code.includes("CAMBRIDGE") || code.includes("CAE") || code.includes("FCE")) return CERTIFICATE_TYPES.CAMBRIDGE;
  if (code.includes("TOEFL")) return CERTIFICATE_TYPES.TOEFL;
  return CERTIFICATE_TYPES.IELTS;
}

/**
 * 1. Thuật toán làm tròn điểm IELTS chuẩn British Council / IDP / Cambridge
 * - < 0.25 -> làm tròn xuống .0
 * - >= 0.25 và < 0.75 -> làm tròn thành .5
 * - >= 0.75 -> làm tròn lên .0 tiếp theo
 */
export function calculateIeltsOverall(l, r, w, s) {
  const nums = [parseFloat(l), parseFloat(r), parseFloat(w), parseFloat(s)];
  if (nums.some(isNaN)) return "0.0 Overall";
  const avg = nums.reduce((a, b) => a + b, 0) / 4;
  const dec = avg - Math.floor(avg);
  let rounded;
  if (dec < 0.25) rounded = Math.floor(avg);
  else if (dec < 0.75) rounded = Math.floor(avg) + 0.5;
  else rounded = Math.floor(avg) + 1.0;
  return `${rounded.toFixed(1)} Overall`;
}

/**
 * 2. Thuật toán tính điểm TOEIC Listening & Reading (Tối đa 990)
 */
export function calculateToeicOverall(l, r) {
  const listening = Math.max(0, Math.min(495, parseInt(l) || 0));
  const reading = Math.max(0, Math.min(495, parseInt(r) || 0));
  return `${listening + reading}/990`;
}

/**
 * 3. Thuật toán tính điểm VSTEP (Khung 6 bậc Việt Nam)
 * - Trung bình cộng 4 kỹ năng làm tròn đến 0.5
 * - Bậc 3 (B1): 4.0 - 5.5
 * - Bậc 4 (B2): 6.0 - 8.0
 * - Bậc 5 (C1): 8.5 - 10.0
 */
export function calculateVstepOverall(l, r, w, s) {
  const nums = [parseFloat(l), parseFloat(r), parseFloat(w), parseFloat(s)];
  if (nums.some(isNaN)) return "Chưa đạt";
  const avg = nums.reduce((a, b) => a + b, 0) / 4;
  const rounded = Math.round(avg * 2) / 2;
  let level = "Không đạt";
  if (rounded >= 8.5) level = "Bậc 5 (C1)";
  else if (rounded >= 6.0) level = "Bậc 4 (B2)";
  else if (rounded >= 4.0) level = "Bậc 3 (B1)";
  return `${rounded.toFixed(1)} / 10.0 - ${level}`;
}

/**
 * 4. Thuật toán tính điểm Cambridge English Scale (160 - 210)
 */
export function calculateCambridgeOverall(l, r, w, s) {
  const nums = [parseFloat(l), parseFloat(r), parseFloat(w), parseFloat(s)];
  if (nums.some(isNaN)) return "0 C1 Scale";
  const avg = Math.round(nums.reduce((a, b) => a + b, 0) / 4);
  let grade = "Pass";
  if (avg >= 200) grade = "Grade A (C2 Level)";
  else if (avg >= 193) grade = "Grade B";
  else if (avg >= 180) grade = "Grade C";
  else grade = "Level B2";
  return `${avg}/210 (${grade})`;
}

/**
 * 5. Tính điểm tổng theo loại chứng chỉ
 */
export function computeOverallScore(courseCode, { listening, reading, writing, speaking }) {
  const type = detectCourseType(courseCode);
  switch (type) {
    case CERTIFICATE_TYPES.IELTS:
      return calculateIeltsOverall(listening, reading, writing, speaking);
    case CERTIFICATE_TYPES.TOEIC:
      return calculateToeicOverall(listening, reading);
    case CERTIFICATE_TYPES.VSTEP:
      return calculateVstepOverall(listening, reading, writing, speaking);
    case CERTIFICATE_TYPES.CAMBRIDGE:
      return calculateCambridgeOverall(listening, reading, writing, speaking);
    default:
      return calculateIeltsOverall(listening, reading, writing, speaking);
  }
}

/**
 * 6. Tính ngày hết hạn dựa theo quy định của từng loại chứng chỉ
 * - IELTS/TOEIC/VSTEP: Thường có hiệu lực 2 năm (24 tháng) theo khuyến nghị tiếp nhận
 * - CAMBRIDGE: Vĩnh viễn (trả về chuỗi rỗng / vô thời hạn)
 */
export function getExpiryDateForCourse(courseCode, issueDateStr) {
  if (!issueDateStr) return "";
  const type = detectCourseType(courseCode);
  if (type === CERTIFICATE_TYPES.CAMBRIDGE) {
    return ""; // Vô thời hạn
  }

  const d = new Date(issueDateStr);
  if (isNaN(d.getTime())) return "";
  d.setFullYear(d.getFullYear() + 2); // 2 năm
  return d.toISOString().slice(0, 10);
}

/**
 * 7. Kiểm tra tính hợp lệ của điểm số theo thang điểm
 */
export function validateSubScores(courseCode, { listening, reading, writing, speaking }) {
  const type = detectCourseType(courseCode);
  const errors = [];

  const checkRange = (name, val, min, max, step = 0.5) => {
    const num = parseFloat(val);
    if (isNaN(num)) {
      errors.push(`${name} chưa được nhập điểm.`);
    } else if (num < min || num > max) {
      errors.push(`${name} phải nằm trong khoảng từ ${min} đến ${max}.`);
    }
  };

  switch (type) {
    case CERTIFICATE_TYPES.IELTS:
      checkRange("Điểm Nghe (Listening)", listening, 0, 9);
      checkRange("Điểm Đọc (Reading)", reading, 0, 9);
      checkRange("Điểm Viết (Writing)", writing, 0, 9);
      checkRange("Điểm Nói (Speaking)", speaking, 0, 9);
      break;
    case CERTIFICATE_TYPES.TOEIC:
      checkRange("Điểm Nghe (Listening)", listening, 5, 495);
      checkRange("Điểm Đọc (Reading)", reading, 5, 495);
      break;
    case CERTIFICATE_TYPES.VSTEP:
      checkRange("Điểm Nghe (Listening)", listening, 0, 10);
      checkRange("Điểm Đọc (Reading)", reading, 0, 10);
      checkRange("Điểm Viết (Writing)", writing, 0, 10);
      checkRange("Điểm Nói (Speaking)", speaking, 0, 10);
      break;
    case CERTIFICATE_TYPES.CAMBRIDGE:
      checkRange("Kỹ năng Nghe", listening, 80, 230);
      checkRange("Kỹ năng Đọc", reading, 80, 230);
      checkRange("Kỹ năng Viết", writing, 80, 230);
      checkRange("Kỹ năng Nói", speaking, 80, 230);
      break;
    default:
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
