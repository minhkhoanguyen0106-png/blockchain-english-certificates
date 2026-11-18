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

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbName = process.env.DB_NAME || 'EnglishCertificate';
  const isAivenOrSsl = process.env.DB_SSL === 'true' || dbHost.includes('aivencloud.com');

  const connection = await mysql.createConnection({
    host: dbHost,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true,
    ...(isAivenOrSsl ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    let schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf-8');
    let seedSql = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf-8');

    // Điều chỉnh database name theo .env
    schemaSql = schemaSql.replace(/english_cert_blockchain/g, dbName);
    seedSql = seedSql.replace(/english_cert_blockchain/g, dbName);

    console.log(`1️⃣ Đang chạy schema.sql (Tạo cấu trúc bảng cho ${dbName})...`);
    await connection.query(schemaSql);
    console.log('   ✅ Đã tạo cấu trúc bảng thành công!');

    console.log('2️⃣ Đang chạy seed.sql (Nạp dữ liệu mẫu cho cả 8 trang giao diện)...');
    await connection.query(seedSql);
    console.log('   ✅ Đã nạp dữ liệu mẫu thành công!');

    console.log('3️⃣ Đang sinh file PDF chứng chỉ mẫu có nhúng QR Code thực tế...');
    const [rows] = await connection.query(`
      SELECT c.*, s.student_code, s.full_name AS student_name, s.citizen_id, co.course_code, co.course_name
      FROM \`${dbName}\`.certificates c
      JOIN \`${dbName}\`.students s ON c.student_id = s.id
      JOIN \`${dbName}\`.courses co ON c.course_id = co.id
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
