import { Collection } from 'discord.js';
import { config } from '../config/config.js';
import { createWarningEmbed } from '../utils/embed.js';

const cooldowns = new Collection();

export function checkCooldown(interaction, command) {
  const commandName = command.data.name;
  const cooldownAmount = (command.cooldown ?? config.cooldowns[commandName] ?? config.cooldowns.default) * 1000;

  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Collection());
  }

  const timestamps = cooldowns.get(commandName);
  const userId = interaction.user.id;
  const now = Date.now();

  if (timestamps.has(userId)) {
    const expiration = timestamps.get(userId) + cooldownAmount;
    if (now < expiration) {
      const remaining = ((expiration - now) / 1000).toFixed(1);
      return {
        onCooldown: true,
        embed: createWarningEmbed(
          'Cooldown Aktif',
          `⏳ Harap tunggu **${remaining} detik** sebelum menggunakan \`/${commandName}\` lagi.`
        ),
      };
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
  return { onCooldown: false };
}
