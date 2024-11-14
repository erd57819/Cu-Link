// db.js - DB 연결 모듈 (backend/config/db.js)
const mysql = require('mysql2');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    supportBigNumbers: true,
    bigNumberStrings: true,
});

conn.connect((err) => {
    if (err) {
        console.error('DB 연결 실패:', err);
    } else {
        console.log('DB 연결 성공');
    }
});

module.exports = conn;