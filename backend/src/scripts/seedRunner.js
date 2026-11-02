import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateCertificatePdf } from '../services/pdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });

async function runSeed() {
  console.log('🔄 Đang khởi tạo CSDL và nạp dữ liệu mẫu (Seed Data)...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true
  });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf-8');
    const seedSql = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf-8');

    console.log('1️⃣ Đang chạy schema.sql (Tạo cơ sở dữ liệu và 5 bảng)...');
    await connection.query(schemaSql);
    console.log('   ✅ Đã tạo cấu trúc bảng thành công!');

    console.log('2️⃣ Đang chạy seed.sql (Nạp dữ liệu mẫu cho cả 8 trang giao diện)...');
    await connection.query(seedSql);
    console.log('   ✅ Đã nạp dữ liệu mẫu thành công!');

    console.log('3️⃣ Đang sinh file PDF chứng chỉ mẫu có nhúng QR Code thực tế...');
    const [rows] = await connection.query(`
      SELECT c.*, s.student_code, s.full_name AS student_name, s.citizen_id, co.course_code, co.course_name
      FROM english_cert_blockchain.certificates c
      JOIN english_cert_blockchain.students s ON c.student_id = s.id
      JOIN english_cert_blockchain.courses co ON c.course_id = co.id
      WHERE c.status != 'PENDING'
    `);

    for (const cert of rows) {
      await generateCertificatePdf(cert);
      console.log(`   📄 Đã tạo file PDF cho chứng chỉ: ${cert.certificate_code}`);
    }

    console.log('🎉 Hoàn tất toàn bộ CSDL và file chứng chỉ PDF!');
    console.log('👉 Bạn có thể khởi động backend bằng lệnh: npm run dev');
  } catch (error) {
    console.error('❌ Lỗi khi chạy seed:', error.message);
  } finally {
    await connection.end();
  }
}

runSeed();
