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
  seedServers();
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

    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cfx_code TEXT UNIQUE NOT NULL,
      name TEXT,
      alias TEXT,
      endpoint TEXT,
      is_active INTEGER DEFAULT 1,
      added_by TEXT,
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

  // Migrate: add alias column if not exists (for existing DBs)
  try { db.exec(`ALTER TABLE servers ADD COLUMN alias TEXT`); } catch {}
  // Migrate: add endpoint column if not exists
  try { db.exec(`ALTER TABLE servers ADD COLUMN endpoint TEXT`); } catch {}

  logger.info('[Database] Schema initialized');
}

const SEED_SERVERS = [
  {
    cfx_code: '49.128.187.46:30120',
    name: 'Satumimpi',
    alias: 'satumimpi,satu mimpi,smrp',
    endpoint: '49.128.187.46:30120',
  },
  {
    cfx_code: '160.187.141.169:30120',
    name: 'Kampoeng RP',
    alias: 'kampoengrp,kampoeng rp,kampung rp,krp',
    endpoint: '160.187.141.169:30120',
  },
  {
    cfx_code: '49.128.187.82:30120',
    name: 'Kisah Nusantara',
    alias: 'kisahnusantara,kisah nusantara,kisa,knrp',
    endpoint: '49.128.187.82:30120',
  },
  {
    cfx_code: '49.128.187.110:30120',
    name: 'Nusa V',
    alias: 'nusav,nusa v,nusa5',
    endpoint: '49.128.187.110:30120',
  },
  {
    cfx_code: '31.58.143.101:30120',
    name: 'Kota Kita',
    alias: 'kotakita,kota kita,kkrp',
    endpoint: '31.58.143.101:30120',
  },
  {
    cfx_code: '31.58.143.12:30120',
    name: 'ASE STATE',
    alias: 'asestate,ase state,ase',
    endpoint: '31.58.143.12:30120',
  },
  {
    cfx_code: '49.128.187.58:30120',
    name: 'Garuda Prime',
    alias: 'garudaprime,garuda prime,garuda,gprp',
    endpoint: '49.128.187.58:30120',
  },
  {
    cfx_code: '49.128.187.86:30120',
    name: 'Rumah Kita',
    alias: 'rumahkita,rumah kita,rkrp',
    endpoint: '49.128.187.86:30120',
  },
  {
    cfx_code: 'kota.indopride.id:30120',
    name: 'Indopride',
    alias: 'indopride,indo pride,idrp',
    endpoint: 'kota.indopride.id:30120',
  },
  {
    cfx_code: 'private-placeholder.cfx.re',
    name: 'IME',
    alias: 'ime',
    endpoint: 'private-placeholder.cfx.re',
  },
];

function seedServers() {
  for (const s of SEED_SERVERS) {
    try {
      db.prepare(
        `INSERT OR IGNORE INTO servers (cfx_code, name, alias, endpoint, is_active, added_by)
         VALUES (?, ?, ?, ?, 1, 'system')`
      ).run(s.cfx_code, s.name, s.alias, s.endpoint);

      // Update alias/name if server already exists (keeps endpoint fresh)
      db.prepare(
        `UPDATE servers SET name = ?, alias = ?, endpoint = ? WHERE cfx_code = ?`
      ).run(s.name, s.alias, s.endpoint, s.cfx_code);
    } catch {}
  }
  logger.info('[Database] Servers seeded');
}

export default getDb;
