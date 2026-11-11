// db.js - DB 연결 모듈 (backend/config/db.js)
const mysql = require('mysql2');
const { getDbOptions } = require('./db-options');

// Existing controllers keep using conn.query(...). The pool reconnects as needed.
const conn = mysql.createPool({
    ...getDbOptions(),
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 60000,
});

module.exports = conn;
