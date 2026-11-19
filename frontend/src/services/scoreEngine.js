// ================================================================
// ENGINE TÍNH ĐIỂM & QUY TẮC HIỆU LỰC CHỨNG CHỈ (v2.2)
// Hỗ trợ: IELTS, TOEIC (L&R), VSTEP, CAMBRIDGE, TOEFL, GENERAL
// Ưu tiên score_type & max_score thật từ CSDL khóa học
// ================================================================

export const CERTIFICATE_TYPES = {
  IELTS: "IELTS",
  TOEIC: "TOEIC",
  VSTEP: "VSTEP",
  CAMBRIDGE: "CAMBRIDGE",
  TOEFL: "TOEFL",
  GENERAL: "GENERAL"
};

export const DEFAULT_MAX_SCORE_BY_TYPE = {
  IELTS: "9.0",
  TOEIC: "990",
  VSTEP: "10.0",
  CAMBRIDGE: "210",
  TOEFL: "120",
  GENERAL: "100"
};

/**
 * Chuẩn hóa chuỗi điểm đầu vào (trim + chuyển dấu phẩy thập phân tiếng Việt ',' -> '.')
 */
export function normalizeScoreInput(val) {
  if (val === null || val === undefined) return "";
  return String(val).trim().replace(/,/g, ".");
}

/**
 * Parse số điểm nghiêm ngặt (chặn các chuỗi rác như "7.5abc", "--5", "7..5")
 */
export function parseStrictScore(val) {
  const normalized = normalizeScoreInput(val);
  if (!normalized || !/^\d+(\.\d+)?$/.test(normalized)) {
    return NaN;
  }
  const num = Number(normalized);
  return Number.isFinite(num) ? num : NaN;
}

/**
 * Tự động format chuẩn hóa điểm theo chuẩn chứng chỉ (7 -> 7.0 đối với IELTS/VSTEP):
 * - IELTS & VSTEP: số nguyên 7 -> 7.0, 7,5 -> 7.5
 * - TOEIC / CAMBRIDGE / TOEFL: số nguyên (ví dụ 450, 195, 28)
 */
export function formatSubScore(courseCode, val, options = {}) {
  const normalized = normalizeScoreInput(val);
  if (!normalized) return "";
  const num = parseStrictScore(normalized);
  if (isNaN(num)) return normalized;

  const type = detectCourseType(courseCode, options.scoreType);
  switch (type) {
    case CERTIFICATE_TYPES.IELTS:
    case CERTIFICATE_TYPES.VSTEP:
      return num.toFixed(1);
    case CERTIFICATE_TYPES.TOEIC:
    case CERTIFICATE_TYPES.CAMBRIDGE:
    case CERTIFICATE_TYPES.TOEFL:
      return String(Math.round(num));
    case CERTIFICATE_TYPES.GENERAL:
    default:
      return Number.isInteger(num) ? String(num) : num.toFixed(1);
  }
}

/**
 * Nhận diện chuẩn thang điểm: ưu tiên score_type từ CSDL, fallback theo course_code
 */
export function detectCourseType(courseCode = "", explicitScoreType = "") {
  const explicit = (explicitScoreType || "").trim().toUpperCase();
  if (explicit && CERTIFICATE_TYPES[explicit]) {
    return CERTIFICATE_TYPES[explicit];
  }

  const code = (courseCode || "").toUpperCase();
  if (code.includes("IELTS")) return CERTIFICATE_TYPES.IELTS;
  if (code.includes("TOEIC")) return CERTIFICATE_TYPES.TOEIC;
  if (code.includes("VSTEP")) return CERTIFICATE_TYPES.VSTEP;
  if (code.includes("CAMBRIDGE") || code.includes("CAE") || code.includes("FCE")) return CERTIFICATE_TYPES.CAMBRIDGE;
  if (code.includes("TOEFL")) return CERTIFICATE_TYPES.TOEFL;
  return CERTIFICATE_TYPES.GENERAL;
}

export function getScoreRangeHint(courseCode = "", options = {}) {
  const type = detectCourseType(courseCode, options.scoreType);
  const maxVal = parseFloat(options.maxScore) || 100;
  switch (type) {
    case CERTIFICATE_TYPES.IELTS:
      return "IELTS: mỗi kỹ năng 0 – 9.0 (bước 0.5)";
    case CERTIFICATE_TYPES.TOEIC:
      return "TOEIC: Nghe & Đọc 5 – 495 (bước 5)";
    case CERTIFICATE_TYPES.VSTEP:
      return "VSTEP: mỗi kỹ năng 0 – 10.0 (bước 0.5, đạt từ 4.0)";
    case CERTIFICATE_TYPES.CAMBRIDGE:
      return "Cambridge Scale: mỗi kỹ năng 80 – 230 (số nguyên)";
    case CERTIFICATE_TYPES.TOEFL:
      return "TOEFL iBT: mỗi kỹ năng 0 – 30 (số nguyên)";
    case CERTIFICATE_TYPES.GENERAL:
    default:
      return `Thang điểm tổng quát: mỗi kỹ năng 0 – ${maxVal}`;
  }
}

/**
 * 1. IELTS chuẩn British Council / IDP
 */
export function calculateIeltsOverall(l, r, w, s) {
  const nums = [parseStrictScore(l), parseStrictScore(r), parseStrictScore(w), parseStrictScore(s)];
  if (nums.some(isNaN)) return "";
  const avg = nums.reduce((a, b) => a + b, 0) / 4;
  const dec = avg - Math.floor(avg);
  let rounded;
  if (dec < 0.25) rounded = Math.floor(avg);
  else if (dec < 0.75) rounded = Math.floor(avg) + 0.5;
  else rounded = Math.floor(avg) + 1.0;
  return `${rounded.toFixed(1)} Overall`;
}

/**
 * 2. TOEIC Listening & Reading (Tối đa 990)
 */
export function calculateToeicOverall(l, r) {
  const lNum = parseStrictScore(l);
  const rNum = parseStrictScore(r);
  if (isNaN(lNum) || isNaN(rNum) || !Number.isInteger(lNum) || !Number.isInteger(rNum)) return "";
  const listening = Math.max(0, Math.min(495, lNum));
  const reading = Math.max(0, Math.min(495, rNum));
  return `${listening + reading}/990`;
}

/**
 * 3. VSTEP (Khung 6 bậc Việt Nam)
 */
export function calculateVstepOverall(l, r, w, s) {
  const nums = [parseStrictScore(l), parseStrictScore(r), parseStrictScore(w), parseStrictScore(s)];
  if (nums.some(isNaN)) return "";
  const avg = nums.reduce((a, b) => a + b, 0) / 4;
  const rounded = Math.round(avg * 2) / 2;
  let level = "Không đạt";
  if (rounded >= 8.5) level = "Bậc 5 (C1)";
  else if (rounded >= 6.0) level = "Bậc 4 (B2)";
  else if (rounded >= 4.0) level = "Bậc 3 (B1)";
  return `${rounded.toFixed(1)} / 10.0 - ${level}`;
}

/**
 * 4. Cambridge English Scale (160 - 210)
 */
export function calculateCambridgeOverall(l, r, w, s) {
  const nums = [parseStrictScore(l), parseStrictScore(r), parseStrictScore(w), parseStrictScore(s)];
  if (nums.some(isNaN)) return "";
  const avg = Math.round(nums.reduce((a, b) => a + b, 0) / 4);
  let grade = "Pass";
  if (avg >= 200) grade = "Grade A (C2 Level)";
  else if (avg >= 193) grade = "Grade B";
  else if (avg >= 180) grade = "Grade C";
  else grade = "Level B2";
  return `${avg}/210 (${grade})`;
}

/**
 * 5. TOEFL iBT (0 - 120, mỗi kỹ năng 0 - 30)
 */
export function calculateToeflOverall(l, r, w, s) {
  const nums = [parseStrictScore(l), parseStrictScore(r), parseStrictScore(w), parseStrictScore(s)];
  if (nums.some((n) => isNaN(n) || !Number.isInteger(n))) return "";
  const total = nums.reduce((a, b) => a + Math.max(0, Math.min(30, b)), 0);
  return `${total}/120 iBT`;
}

/**
 * 6. Thang điểm tổng quát (GENERAL) theo max_score của khóa học
 */
export function calculateGeneralOverall(l, r, w, s, maxScore = 100) {
  const rawList = [l, r, w, s].map(normalizeScoreInput).filter((v) => v !== "");
  if (rawList.length === 0) return "";
  const nums = rawList.map(parseStrictScore);
  if (nums.some(isNaN)) return "";
  const maxVal = parseFloat(maxScore) > 0 ? parseFloat(maxScore) : 100;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  const formatted = Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
  return `${formatted}/${maxVal}`;
}

/**
 * 7. Tính điểm tổng theo loại chứng chỉ
 */
export function computeOverallScore(courseCode, { listening, reading, writing, speaking }, options = {}) {
  const type = detectCourseType(courseCode, options.scoreType);
  switch (type) {
    case CERTIFICATE_TYPES.IELTS:
      return calculateIeltsOverall(listening, reading, writing, speaking);
    case CERTIFICATE_TYPES.TOEIC:
      return calculateToeicOverall(listening, reading);
    case CERTIFICATE_TYPES.VSTEP:
      return calculateVstepOverall(listening, reading, writing, speaking);
    case CERTIFICATE_TYPES.CAMBRIDGE:
      return calculateCambridgeOverall(listening, reading, writing, speaking);
    case CERTIFICATE_TYPES.TOEFL:
      return calculateToeflOverall(listening, reading, writing, speaking);
    case CERTIFICATE_TYPES.GENERAL:
    default:
      return calculateGeneralOverall(listening, reading, writing, speaking, options.maxScore);
  }
}

/**
 * 8. Tính ngày hết hạn dựa theo quy định của từng loại chứng chỉ
 * - IELTS/TOEIC/VSTEP/TOEFL: Hiệu lực 2 năm
 * - CAMBRIDGE/GENERAL: Vô thời hạn
 */
export function getExpiryDateForCourse(courseCode, issueDateStr, options = {}) {
  if (!issueDateStr) return "";
  const type = detectCourseType(courseCode, options.scoreType);
  if (type === CERTIFICATE_TYPES.CAMBRIDGE || type === CERTIFICATE_TYPES.GENERAL) {
    return ""; // Vô thời hạn
  }

  const d = new Date(issueDateStr);
  if (isNaN(d.getTime())) return "";
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().slice(0, 10);
}

/**
 * 9. Kiểm tra tính hợp lệ của điểm số theo chuẩn thang điểm & bước nhảy
 */
export function validateSubScores(courseCode, { listening, reading, writing, speaking }, options = {}) {
  const type = detectCourseType(courseCode, options.scoreType);
  const errors = [];

  const checkRange = (name, val, min, max, step = 0.5) => {
    const normalized = normalizeScoreInput(val);
    if (!normalized) {
      errors.push(`${name} chưa được nhập điểm.`);
      return;
    }
    const num = parseStrictScore(normalized);
    if (isNaN(num)) {
      errors.push(`${name} ("${val}") phải là số hợp lệ (không chứa chữ hoặc ký tự đặc biệt).`);
      return;
    }
    if (num < min || num > max) {
      errors.push(`${name} phải nằm trong khoảng từ ${min} đến ${max}.`);
      return;
    }
    if (step > 0) {
      const scaled = Math.round((num - min) / step);
      const expected = min + scaled * step;
      if (Math.abs(num - expected) > 1e-6) {
        errors.push(`${name} (${num}) không đúng bước nhảy chuẩn (phải là bội số của ${step}).`);
      }
    }
  };

  switch (type) {
    case CERTIFICATE_TYPES.IELTS:
      checkRange("Điểm Nghe (Listening)", listening, 0, 9, 0.5);
      checkRange("Điểm Đọc (Reading)", reading, 0, 9, 0.5);
      checkRange("Điểm Viết (Writing)", writing, 0, 9, 0.5);
      checkRange("Điểm Nói (Speaking)", speaking, 0, 9, 0.5);
      break;
    case CERTIFICATE_TYPES.TOEIC:
      checkRange("Điểm Nghe (Listening)", listening, 5, 495, 5);
      checkRange("Điểm Đọc (Reading)", reading, 5, 495, 5);
      break;
    case CERTIFICATE_TYPES.VSTEP: {
      checkRange("Điểm Nghe (Listening)", listening, 0, 10, 0.5);
      checkRange("Điểm Đọc (Reading)", reading, 0, 10, 0.5);
      checkRange("Điểm Viết (Writing)", writing, 0, 10, 0.5);
      checkRange("Điểm Nói (Speaking)", speaking, 0, 10, 0.5);
      if (errors.length === 0) {
        const avg = (
          parseStrictScore(listening) +
          parseStrictScore(reading) +
          parseStrictScore(writing) +
          parseStrictScore(speaking)
        ) / 4;
        const rounded = Math.round(avg * 2) / 2;
        if (rounded < 4.0) {
          errors.push(`Điểm trung bình VSTEP (${rounded.toFixed(1)}/10) chưa đạt ngưỡng tối thiểu Bậc 3 (4.0) để cấp chứng chỉ.`);
        }
      }
      break;
    }
    case CERTIFICATE_TYPES.CAMBRIDGE:
      checkRange("Kỹ năng Nghe", listening, 80, 230, 1);
      checkRange("Kỹ năng Đọc", reading, 80, 230, 1);
      checkRange("Kỹ năng Viết", writing, 80, 230, 1);
      checkRange("Kỹ năng Nói", speaking, 80, 230, 1);
      break;
    case CERTIFICATE_TYPES.TOEFL:
      checkRange("TOEFL Listening", listening, 0, 30, 1);
      checkRange("TOEFL Reading", reading, 0, 30, 1);
      checkRange("TOEFL Writing", writing, 0, 30, 1);
      checkRange("TOEFL Speaking", speaking, 0, 30, 1);
      break;
    case CERTIFICATE_TYPES.GENERAL:
    default: {
      const maxVal = parseFloat(options.maxScore) > 0 ? parseFloat(options.maxScore) : 100;
      const filled = [
        { name: "Listening", val: listening },
        { name: "Reading", val: reading },
        { name: "Writing", val: writing },
        { name: "Speaking", val: speaking }
      ].filter((item) => normalizeScoreInput(item.val) !== "");
      if (filled.length === 0) {
        errors.push("Vui lòng nhập ít nhất 1 điểm kỹ năng.");
      } else {
        filled.forEach((item) => checkRange(item.name, item.val, 0, maxVal, 0));
      }
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
