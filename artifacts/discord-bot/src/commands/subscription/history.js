import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDb } from '../../database/db.js';
import { config } from '../../config/config.js';
import { SEPARATOR } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('📜 Riwayat pembayaran kamu'),
  cooldown: 5,

  async execute(interaction) {
    const db = getDb();
    const userId = interaction.user.id;

    const payments = db.prepare(`
      SELECT * FROM payments WHERE discord_id = ? ORDER BY created_at DESC LIMIT 10
    `).all(userId);

    if (!payments.length) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle('📜 Riwayat Pembayaran')
        .setDescription(`${SEPARATOR}\n\nKamu belum memiliki riwayat pembayaran.\n\n${SEPARATOR}`)
        .setFooter({ text: `${config.bot.name} • v${config.bot.version}` })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const planLabels = { '1month': '1 Bulan', '3months': '3 Bulan', lifetime: 'Lifetime' };
    const statusEmoji = { pending: '⏳', success: '✅', rejected: '❌' };

    const lines = payments.map((p, i) => {
      const emoji = statusEmoji[p.status] || '❓';
      const plan = planLabels[p.plan] || p.plan;
      const date = new Date(p.created_at);
      return `${i + 1}. ${emoji} **${plan}** — Rp ${p.amount.toLocaleString('id-ID')} — <t:${Math.floor(date.getTime() / 1000)}:d>`;
    });

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📜 Riwayat Pembayaran')
      .setDescription(`${SEPARATOR}\n\n${lines.join('\n')}\n\n${SEPARATOR}`)
      .setFooter({ text: `${config.bot.name} • 10 transaksi terakhir` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
