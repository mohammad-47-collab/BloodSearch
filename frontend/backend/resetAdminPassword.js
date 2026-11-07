import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

dotenv.config();

const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bloodsearch_db',
    port: Number(process.env.DB_PORT || 3306)
});

const email = 'dhakacityclg1257@gmail.com';
const password = 'Admin@12345';

const passwordHash = await bcrypt.hash(password, 10);

const [result] = await db.execute(
    `UPDATE users
     SET password_hash = ?
     WHERE email = ? AND role = 'admin'`,
    [passwordHash, email]
);

console.log('Updated rows:', result.affectedRows);

await db.end();