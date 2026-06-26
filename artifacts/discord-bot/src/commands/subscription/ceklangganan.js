import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDb } from '../../database/db.js';
import { config } from '../../config/config.js';
import { SEPARATOR } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ceklangganan')
    .setDescription('📋 Cek status subscription kamu'),
  cooldown: 5,

  async execute(interaction) {
    const db = getDb();
    const userId = interaction.user.id;

    const sub = db.prepare(`SELECT * FROM subscription WHERE discord_id = ?`).get(userId);

    let embed;

    if (!sub || !sub.is_active) {
      embed = new EmbedBuilder()
        .setColor(config.colors.danger)
        .setTitle('❌ Tidak Berlangganan')
        .setDescription(`${SEPARATOR}\n\nKamu belum memiliki subscription aktif.\n\nGunakan \`/subscribe\` untuk melihat paket tersedia.\n\n${SEPARATOR}`)
        .setFooter({ text: `${config.bot.name} • v${config.bot.version}` })
        .setTimestamp();
    } else {
      const planLabels = { '1month': '1 Bulan', '3months': '3 Bulan', lifetime: 'Lifetime ♾️' };
      const planLabel = planLabels[sub.plan] || sub.plan;
      const expiry = sub.expires_at ? new Date(sub.expires_at) : null;
      const isLifetime = sub.plan === 'lifetime';

      const expiryStr = isLifetime
        ? '♾️ Selamanya'
        : expiry
          ? `<t:${Math.floor(expiry.getTime() / 1000)}:F> (<t:${Math.floor(expiry.getTime() / 1000)}:R>)`
          : 'N/A';

      embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('✅ Subscription Aktif')
        .setDescription(`${SEPARATOR}\n\n💎 Selamat! Kamu adalah member premium!\n\n${SEPARATOR}`)
        .addFields(
          { name: '📦 Paket', value: `\`${planLabel}\``, inline: true },
          { name: '📅 Berakhir', value: expiryStr, inline: false },
          { name: '👤 User', value: `<@${userId}>`, inline: true },
        )
        .setFooter({ text: `${config.bot.name} • v${config.bot.version}` })
        .setTimestamp();
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
