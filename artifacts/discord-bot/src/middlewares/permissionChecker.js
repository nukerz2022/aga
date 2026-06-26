import { createErrorEmbed } from '../utils/embed.js';
import { config } from '../config/config.js';

export function isOwner(userId) {
  return userId === config.discord.ownerId;
}

export function requireOwner(interaction) {
  if (!isOwner(interaction.user.id)) {
    return {
      allowed: false,
      embed: createErrorEmbed(
        'Akses Ditolak',
        '🔒 Command ini hanya dapat digunakan oleh **Bot Owner**.'
      ),
    };
  }
  return { allowed: true };
}

export function requirePermission(interaction, permission) {
  if (!interaction.member?.permissions?.has(permission)) {
    return {
      allowed: false,
      embed: createErrorEmbed(
        'Akses Ditolak',
        `🔒 Kamu memerlukan permission **${permission}** untuk menggunakan command ini.`
      ),
    };
  }
  return { allowed: true };
}
