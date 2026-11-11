const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

function createSessionStore(pool) {
  // v3.0.3 filters its own connection options and drops `ssl`.
  // Passing a TLS-enabled mysql2 pool prevents a separate plaintext connection.
  return new MySQLStore({
    createDatabaseTable: false, // The sessions table has already been restored.
    endConnectionOnClose: false, // Shared pool belongs to the application.
  }, pool.promise());
}

module.exports = createSessionStore;
