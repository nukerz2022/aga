import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from '../config/config.js';
import logger from '../utils/logger.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../database.sqlite');

let db;

function getSqlJs() {
  const initSqlJs = require('sql.js');
  return initSqlJs();
}

let _sqlJsDb = null;

function wrapDb(sqliteDb) {
  return {
    prepare(sql) {
      return {
        run(...args) {
          sqliteDb.run(sql, args);
        },
        get(...args) {
          const stmt = sqliteDb.prepare(sql);
          stmt.bind(args);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        },
        all(...args) {
          const stmt = sqliteDb.prepare(sql);
          const rows = [];
          stmt.bind(args);
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
      };
    },
    exec(sql) {
      sqliteDb.run(sql);
    },
    close() {
      const data = sqliteDb.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
      sqliteDb.close();
    },
    _raw: sqliteDb,
    _persist() {
      const data = sqliteDb.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    },
  };
}

export async function initDb() {
  if (db) return db;

  const SQL = await getSqlJs();

  let sqliteDb;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqliteDb = new SQL.Database(fileBuffer);
  } else {
    sqliteDb = new SQL.Database();
  }

  db = wrapDb(sqliteDb);

  initSchema();
  logger.info(`[Database] Connected: ${dbPath}`);

  // Auto-persist every 30 seconds
  setInterval(() => {
    try { db._persist(); } catch {}
  }, 30000);

  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_id TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscription (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_id TEXT UNIQUE NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      expires_at DATETIME,
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_id TEXT NOT NULL,
      plan TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      proof_url TEXT,
      admin_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cfx_code TEXT UNIQUE NOT NULL,
      name TEXT,
      endpoint TEXT,
      is_active INTEGER DEFAULT 1,
      added_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS redeem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      plan TEXT NOT NULL,
      duration_days INTEGER,
      is_used INTEGER DEFAULT 0,
      used_by TEXT,
      used_at DATETIME,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_id TEXT,
      username TEXT,
      command TEXT NOT NULL,
      args TEXT,
      guild_id TEXT,
      status TEXT DEFAULT 'success',
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loopfinder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      guild_id TEXT,
      cfx_code TEXT NOT NULL,
      target_name TEXT NOT NULL,
      interval_seconds INTEGER DEFAULT 60,
      is_active INTEGER DEFAULT 1,
      last_check DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  logger.info('[Database] Schema initialized');
}

export default getDb;
