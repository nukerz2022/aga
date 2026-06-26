import { getDb } from '../database/db.js';
import { createErrorEmbed } from '../utils/embed.js';
import { config } from '../config/config.js';

export function requirePremium(interaction) {
  const db = getDb();
  const userId = interaction.user.id;

  if (userId === config.discord.ownerId) return { isPremium: true };

  const sub = db.prepare(
    `SELECT * FROM subscription WHERE discord_id = ? AND is_active = 1`
  ).get(userId);

  if (!sub) {
    return {
      isPremium: false,
      embed: createErrorEmbed(
        'Premium Required',
        `🔒 Command ini memerlukan **Premium**.\n\nGunakan \`/subscribe\` untuk melihat paket berlangganan kami.\n\n💎 Nikmati fitur lengkap Player Finder dengan harga terjangkau!`
      ),
    };
  }

  if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
    db.prepare(`UPDATE subscription SET is_active = 0 WHERE discord_id = ?`).run(userId);
    return {
      isPremium: false,
      embed: createErrorEmbed(
        'Subscription Expired',
        `❌ Subscription kamu telah **kadaluarsa**.\n\nGunakan \`/subscribe\` untuk memperpanjang berlangganan.`
      ),
    };
  }

  return { isPremium: true, subscription: sub };
}

export function upsertUser(userId, username) {
  const db = getDb();
  db.prepare(`
    INSERT INTO users (discord_id, username)
    VALUES (?, ?)
    ON CONFLICT(discord_id) DO UPDATE SET username = excluded.username, updated_at = CURRENT_TIMESTAMP
  `).run(userId, username);
}
