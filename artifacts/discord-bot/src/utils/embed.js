import { EmbedBuilder } from 'discord.js';
import { config } from '../config/config.js';

const FOOTER_TEXT = `${config.bot.name} • v${config.bot.version}`;
const SEPARATOR = '━━━━━━━━━━━━━━━━━━━━━━━━━━';

export function createBaseEmbed(color = config.colors.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

export function createSuccessEmbed(title, description) {
  return createBaseEmbed(config.colors.success)
    .setTitle(`✅ ${title}`)
    .setDescription(description);
}

export function createErrorEmbed(title, description) {
  return createBaseEmbed(config.colors.danger)
    .setTitle(`❌ ${title}`)
    .setDescription(description);
}

export function createWarningEmbed(title, description) {
  return createBaseEmbed(config.colors.warning)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description);
}

export function createLoadingEmbed(description = 'Sedang memproses...') {
  return createBaseEmbed(config.colors.info)
    .setTitle('⏳ Loading...')
    .setDescription(description);
}

export function createPlayerFoundEmbed(player, serverName, endpoint) {
  const identifiers = player.identifiers || [];
  const discord = identifiers.find(id => id.startsWith('discord:'))?.replace('discord:', '') || 'N/A';
  const steam = identifiers.find(id => id.startsWith('steam:'))?.replace('steam:', '') || 'N/A';
  const license = identifiers.find(id => id.startsWith('license:'))?.replace('license:', '') || 'N/A';

  return new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle('🟢 PLAYER FOUND')
    .setDescription(SEPARATOR)
    .addFields(
      { name: '👤 Nama', value: `\`${player.name}\``, inline: true },
      { name: '🆔 Server ID', value: `\`${player.id}\``, inline: true },
      { name: '🎮 Server', value: `\`${serverName}\``, inline: false },
      { name: '📶 Ping', value: `\`${player.ping ?? 'N/A'} ms\``, inline: true },
      { name: '💬 Discord', value: discord !== 'N/A' ? `<@${discord}>` : 'N/A', inline: true },
      { name: '🎯 Steam', value: steam !== 'N/A' ? `\`${steam}\`` : 'N/A', inline: true },
      { name: '🔑 License', value: `\`${license}\``, inline: false },
      { name: '🌐 Endpoint', value: `\`${endpoint}\``, inline: false },
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

export function createPlayerNotFoundEmbed(name) {
  return createBaseEmbed(config.colors.danger)
    .setTitle('❌ Player Tidak Ditemukan')
    .setDescription(`${SEPARATOR}\n\nPlayer **${name}** tidak ditemukan di server ini.\n\nPastikan nama yang dimasukkan benar atau coba server lain.`);
}

export function createServerEmbed(serverData, cfx) {
  const sv = serverData.Data;
  const players = sv?.clients ?? 0;
  const maxPlayers = sv?.sv_maxclients ?? 0;
  const hostname = sv?.hostname?.replace(/\^[0-9]/g, '') || 'Unknown';
  const oneSync = sv?.vars?.onesync_enabled === 'true' ? '✅ Aktif' : '❌ Nonaktif';
  const endpoint = sv?.connectEndPoints?.[0] || 'N/A';

  return new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle('🟢 SERVER ONLINE')
    .setDescription(SEPARATOR)
    .addFields(
      { name: '🏷️ Nama Server', value: `\`${hostname}\``, inline: false },
      { name: '👥 Player', value: `\`${players}/${maxPlayers}\``, inline: true },
      { name: '🌐 OneSync', value: oneSync, inline: true },
      { name: '🔗 Connect', value: `\`connect ${endpoint}\``, inline: false },
      { name: '🆔 CFX Code', value: `\`${cfx}\``, inline: true },
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

export function createServerOfflineEmbed(cfx) {
  return createBaseEmbed(config.colors.danger)
    .setTitle('🔴 SERVER OFFLINE')
    .setDescription(`${SEPARATOR}\n\nServer \`${cfx}\` tidak dapat dijangkau atau sedang offline.`);
}

export function createPaginationEmbed(title, items, page, totalPages, color = config.colors.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(items.join('\n') || 'Tidak ada data.')
    .setFooter({ text: `${FOOTER_TEXT} • Halaman ${page}/${totalPages}` })
    .setTimestamp();
}

export { SEPARATOR };
