import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'english_cert_blockchain',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Hàm kiểm tra kết nối CSDL
export async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ [Database] Kết nối MySQL thành công tới CSDL:', process.env.DB_NAME || 'english_cert_blockchain');
    connection.release();
    return true;
  } catch (error) {
    console.error('⚠️ [Database] Chưa thể kết nối MySQL:', error.message);
    console.log('💡 Gợi ý: Hãy đảm bảo MySQL (XAMPP / MySQL Server / Docker) đang chạy và thông tin trong .env là chính xác.');
    return false;
  }
}
