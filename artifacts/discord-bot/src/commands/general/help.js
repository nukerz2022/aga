import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../../config/config.js';
import { SEPARATOR } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📋 Tampilkan semua command yang tersedia'),
  cooldown: 5,

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🤖 STRONAUT — Command List')
      .setDescription(`Bot serba guna untuk gaming — FiveM, SA-MP, Steam, Minecraft & more\n${SEPARATOR}`)
      .addFields(
        {
          name: '🎮 FiveM — Player Finder',
          value: [
            '`/player <server> <nama>` — Cari player berdasarkan nama',
            '`/id <server> <id>` — Cari player berdasarkan server ID',
            '`/allplayer <server>` — Lihat semua player online',
            '`/loop <server> <nama> [interval]` — Auto monitor player',
            '`/stoploop` — Hentikan monitoring',
          ].join('\n'),
        },
        {
          name: '📡 FiveM — Server Status',
          value: [
            '`/checkstatus <server>` — Status server (online/offline)',
            '`/serverstatus <server>` — Detail lengkap server',
            '`/serverlist` — Daftar server tersedia',
            '`/requestserver` — Request tambah server baru',
          ].join('\n'),
        },
        {
          name: SEPARATOR,
          value: '\u200B',
        },
        {
          name: '🎯 Gaming Tools',
          value: [
            '`/steam <id/url>` — Cek profil Steam (VAC ban, status, dll)',
            '`/samp <ip> [port]` — Query server SA-MP / Open.MP',
            '`/minecraft <host> [port]` — Cek server Minecraft Java/Bedrock',
            '`/gameserver <ip> <port> <game>` — Query server CS2/Rust/ARK/dll',
            '`/geoip <ip>` — Cek lokasi & info IP address',
          ].join('\n'),
        },
        {
          name: SEPARATOR,
          value: '\u200B',
        },
        {
          name: '💳 Support',
          value: [
            '`/bayar` — Donasi via QRIS',
            '`/support` — Link support server Discord',
          ].join('\n'),
        },
        {
          name: SEPARATOR,
          value: '\u200B',
        },
        {
          name: '🛠 General',
          value: [
            '`/ping` — Cek latency bot',
            '`/help` — Tampilkan menu ini',
          ].join('\n'),
        },
        {
          name: SEPARATOR,
          value: '\u200B',
        },
      )
      .setFooter({ text: `${config.bot.name} • v${config.bot.version} • Semua command gratis!` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('💳 Donasi QRIS')
        .setStyle(ButtonStyle.Success)
        .setCustomId('help:bayar'),
      new ButtonBuilder()
        .setLabel('🔗 Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL(config.discord.supportServer),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
