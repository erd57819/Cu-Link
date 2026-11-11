const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function getDbOptions() {
  const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);

  const port = Number(process.env.DB_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT must be an integer between 1 and 65535');
  }
  const sslValue = (process.env.DB_SSL || 'false').trim().toLowerCase();
  if (!['true', 'false'].includes(sslValue)) throw new Error('DB_SSL must be true or false');
  const enabled = sslValue === 'true';
  if (process.env.DB_HOST.toLowerCase().endsWith('.tidbcloud.com') && !enabled) {
    throw new Error('TiDB Cloud requires DB_SSL=true');
  }

  return {
    host: process.env.DB_HOST,
    port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    supportBigNumbers: true,
    bigNumberStrings: true,
    charset: 'utf8mb4',
    connectTimeout: 15000,
    ssl: enabled ? {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
      verifyIdentity: true,
      // Optional custom CA; otherwise use Node.js's trusted CA certificates.
      ...(process.env.DB_SSL_CA ? {
        ca: fs.readFileSync(path.resolve(__dirname, '..', process.env.DB_SSL_CA)),
      } : {}),
    } : undefined,
  };
}

module.exports = { getDbOptions };
