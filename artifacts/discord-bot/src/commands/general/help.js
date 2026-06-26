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
      .setTitle('🎮 FiveM Player Finder')
      .setDescription(`Cari pemain FiveM dengan mudah dan cepat\n${SEPARATOR}`)
      .addFields(
        {
          name: `📋 Pencarian Player ${config.colors ? '*(Premium)*' : ''}`,
          value: [
            '`/allplayer <server>` — Lihat semua player online',
            '`/player <server> <nama>` — Cari player berdasarkan nama',
            '`/id <server> <id>` — Cari player berdasarkan ID',
            '`/loop <server> <nama> <interval>` — Auto monitoring player',
            '`/stoploop` — Menghentikan monitoring',
          ].join('\n'),
        },
        {
          name: SEPARATOR,
          value: '\u200B',
        },
        {
          name: '💎 Subscription',
          value: [
            '`/subscribe` — Informasi paket',
            '`/bayar` — Pembayaran QRIS',
            '`/redeem` — Redeem code',
            '`/ceklangganan` — Status subscription',
            '`/history` — Riwayat pembayaran',
          ].join('\n'),
        },
        {
          name: SEPARATOR,
          value: '\u200B',
        },
        {
          name: '🆓 Free Commands',
          value: [
            '`/checkstatus` — Status server',
            '`/serverstatus` — Detail server',
            '`/serverlist` — Daftar server',
            '`/ping` — Bot latency',
          ].join('\n'),
        },
        {
          name: SEPARATOR,
          value: '\u200B',
        },
        {
          name: '🛠 Developer',
          value: [
            '`/dev` — Developer Info',
            '`/support` — Discord Support',
            '`/requestserver` — Request server baru',
          ].join('\n'),
        },
        {
          name: SEPARATOR,
          value: '\u200B',
        },
      )
      .setFooter({ text: `${config.bot.name} • v${config.bot.version}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('💎 Subscribe')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('help:subscribe'),
      new ButtonBuilder()
        .setLabel('🔗 Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL(config.discord.supportServer),
      new ButtonBuilder()
        .setLabel('🌐 Website')
        .setStyle(ButtonStyle.Link)
        .setURL(config.discord.supportServer),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
