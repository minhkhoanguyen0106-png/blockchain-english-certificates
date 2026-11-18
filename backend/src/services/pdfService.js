import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads/certificates');
const fontsDir = path.join(__dirname, '../../assets/fonts');

// Đảm bảo thư mục lưu PDF tồn tại
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Hàm hỗ trợ tìm font Unicode hỗ trợ đầy đủ tiếng Việt (Ưu tiên font đóng gói sẵn trong project)
function getAvailableFont(fileName, winFallback) {
  const local = path.join(fontsDir, fileName);
  if (fs.existsSync(local)) return local;
  if (winFallback && fs.existsSync(winFallback)) return winFallback;
  return null;
}

export async function generateQrDataUrl(text) {
  return await QRCode.toDataURL(text, {
    width: 250,
    margin: 2,
    color: {
      dark: '#1e293b',
      light: '#ffffff'
    }
  });
}

export async function generateCertificatePdf(certData) {
  const fileName = `${certData.certificate_code}.pdf`;
  const filePath = path.join(uploadsDir, fileName);
  const verifyUrl = `${process.env.PUBLIC_VERIFY_BASE_URL || 'http://localhost:3000/verify'}?code=${certData.certificate_code}`;

  // Sinh buffer mã QR
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 130, margin: 1 });

  return new Promise((resolve, reject) => {
    // Khổ giấy nằm ngang A4 (841.89 x 595.28)
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Đăng ký font chữ Unicode chuẩn học thuật (Times New Roman / Serif có dấu tiếng Việt)
    const regularFontPath = getAvailableFont('Times-Regular.ttf', 'C:/Windows/Fonts/times.ttf');
    const boldFontPath = getAvailableFont('Times-Bold.ttf', 'C:/Windows/Fonts/timesbd.ttf');
    const italicFontPath = getAvailableFont('Times-Italic.ttf', 'C:/Windows/Fonts/timesi.ttf');

    if (regularFontPath) doc.registerFont('Cert-Regular', regularFontPath);
    if (boldFontPath) doc.registerFont('Cert-Bold', boldFontPath);
    if (italicFontPath) doc.registerFont('Cert-Italic', italicFontPath);

    const fontRegular = regularFontPath ? 'Cert-Regular' : 'Helvetica';
    const fontBold = boldFontPath ? 'Cert-Bold' : 'Helvetica-Bold';
    const fontItalic = italicFontPath ? 'Cert-Italic' : 'Helvetica-Oblique';

    // Vẽ khung viền đôi sang trọng
    doc.rect(20, 20, 801.89, 555.28).lineWidth(4).strokeColor('#0f172a').stroke();
    doc.rect(26, 26, 789.89, 543.28).lineWidth(1.5).strokeColor('#d97706').stroke();

    // Tiêu đề trung tâm
    doc.fontSize(22).font(fontBold).fillColor('#0f172a')
       .text('VIETNAM ENGLISH EDUCATION CENTER', 40, 60, { align: 'center' });
    doc.fontSize(10).font(fontRegular).fillColor('#64748b')
       .text('BLOCKCHAIN-VERIFIED CERTIFICATE OF ACHIEVEMENT', 40, 88, { align: 'center' });

    doc.moveDown(1.5);
    doc.fontSize(28).font(fontBold).fillColor('#b45309')
       .text('CERTIFICATE', { align: 'center' });
    doc.fontSize(12).font(fontItalic).fillColor('#475569')
       .text('This is to certify that', { align: 'center' });

    // Tên học viên (Hỗ trợ tiếng Việt Unicode hoàn hảo: Nguyễn Thị Minh Khoa, Phạm Quốc Hưng...)
    doc.moveDown(0.8);
    doc.fontSize(26).font(fontBold).fillColor('#0f172a')
       .text(certData.student_name || 'STUDENT NAME', { align: 'center' });

    // CCCD / Mã học viên
    doc.fontSize(10).font(fontRegular).fillColor('#64748b')
       .text(`Student Code: ${certData.student_code || '-'}  |  Citizen ID: ${certData.citizen_id || '-'}`, { align: 'center' });

    doc.moveDown(0.8);
    doc.fontSize(12).font(fontItalic).fillColor('#475569')
       .text('has successfully completed and demonstrated proficiency in the examination of', { align: 'center' });

    // Khóa học / Kỳ thi
    doc.moveDown(0.5);
    doc.fontSize(20).font(fontBold).fillColor('#1e40af')
       .text(certData.course_name || 'ENGLISH EXAMINATION', { align: 'center' });

    // Bảng điểm số
    doc.moveDown(0.8);
    const scoreText = `Overall Score: ${certData.score_overall} ` +
      (certData.score_listening ? ` (L: ${certData.score_listening} | R: ${certData.score_reading} | W: ${certData.score_writing || '-'} | S: ${certData.score_speaking || '-'})` : '');
    
    doc.fontSize(14).font(fontBold).fillColor('#0f172a')
       .text(scoreText, { align: 'center' });

    // Thông tin cấp bằng và mã QR phía dưới
    const footerY = 440;
    
    // Cột trái: Thông tin mã và ngày
    doc.fontSize(9).font(fontRegular).fillColor('#334155');
    doc.text(`Certificate Code: ${certData.certificate_code}`, 60, footerY);
    const issueDateStr = certData.issue_date ? new Date(certData.issue_date).toLocaleDateString('vi-VN') : '-';
    doc.text(`Issue Date: ${issueDateStr}`, 60, footerY + 16);
    if (certData.expiry_date) {
      const expDateStr = new Date(certData.expiry_date).toLocaleDateString('vi-VN');
      doc.text(`Expiry Date: ${expDateStr}`, 60, footerY + 32);
    }
    doc.text(`Token ID: ${certData.token_id || 'On-chain Pending'}`, 60, footerY + 48);
    doc.text(`Tx Hash: ${certData.tx_hash ? certData.tx_hash.substring(0, 24) + '...' : 'Pending'}`, 60, footerY + 64);

    // Cột phải: Chữ ký số giám đốc
    doc.fontSize(11).font(fontBold).fillColor('#0f172a')
       .text('CENTER DIRECTOR', 620, footerY, { align: 'center', width: 140 });
    doc.fontSize(9).font(fontItalic).fillColor('#10b981')
       .text('[DIGITALLY VERIFIED]', 620, footerY + 36, { align: 'center', width: 140 });

    // Mã QR ở giữa phía dưới
    doc.image(qrBuffer, 370, footerY - 20, { width: 100, height: 100 });
    doc.fontSize(8).font(fontRegular).fillColor('#64748b')
       .text('Scan to Verify On-chain', 330, footerY + 84, { align: 'center', width: 180 });

    doc.end();

    stream.on('finish', () => {
      resolve(`/uploads/certificates/${fileName}`);
    });
    stream.on('error', reject);
  });
}
