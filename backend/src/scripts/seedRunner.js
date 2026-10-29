import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    console.log('🎉 Hoàn tất! Bạn có thể khởi động backend bằng lệnh: npm run dev');
  } catch (error) {
    console.error('❌ Lỗi khi chạy seed:', error.message);
  } finally {
    await connection.end();
  }
}

runSeed();
