import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });

const dbHost = process.env.DB_HOST || 'localhost';
const isAivenOrSsl = process.env.DB_SSL === 'true' || dbHost.includes('aivencloud.com');

const poolConfig = {
  host: dbHost,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'EnglishCertificate',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(isAivenOrSsl ? { ssl: { rejectUnauthorized: false } } : {})
};

export const pool = mysql.createPool(poolConfig);

// Hàm kiểm tra kết nối CSDL
export async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    const [dbInfo] = await connection.query('SELECT DATABASE() as db, VERSION() as version');
    console.log(`✅ [Database] Kết nối MySQL thành công tới CSDL: ${dbInfo[0].db} (${poolConfig.host}:${poolConfig.port})`);
    connection.release();
    return true;
  } catch (error) {
    console.error('⚠️ [Database] Chưa thể kết nối MySQL:', error.message);
    console.log('💡 Gợi ý: Hãy kiểm tra thông tin cấu hình trong .env và kết nối mạng.');
    return false;
  }
}
