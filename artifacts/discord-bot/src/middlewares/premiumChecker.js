import { getDb } from '../database/db.js';

export function upsertUser(userId, username) {
  const db = getDb();
  db.prepare(`
    INSERT INTO users (discord_id, username)
    VALUES (?, ?)
    ON CONFLICT(discord_id) DO UPDATE SET username = excluded.username, updated_at = CURRENT_TIMESTAMP
  `).run(userId, username);
}
