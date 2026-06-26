import { EmbedBuilder } from 'discord.js';
import { getDb } from '../database/db.js';
import { createSuccessEmbed, createErrorEmbed, SEPARATOR } from '../utils/embed.js';
import { config } from '../config/config.js';

export default {
  customId: 'redeem',

  async execute(interaction) {
    const code = interaction.fields.getTextInputValue('redeem_code').trim().toUpperCase();
    const db = getDb();
    const userId = interaction.user.id;

    await interaction.deferReply({ ephemeral: true });

    const redeemRow = db.prepare(`SELECT * FROM redeem WHERE code = ?`).get(code);

    if (!redeemRow) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Kode Tidak Valid', `Kode \`${code}\` tidak ditemukan di sistem.`)],
      });
    }

    if (redeemRow.is_used) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Kode Sudah Digunakan', `Kode \`${code}\` sudah pernah digunakan.`)],
      });
    }

    const now = new Date();
    let expiresAt = null;

    if (redeemRow.plan !== 'lifetime' && redeemRow.duration_days) {
      expiresAt = new Date(now.getTime() + redeemRow.duration_days * 24 * 60 * 60 * 1000);
    }

    db.prepare(`
      INSERT INTO subscription (discord_id, plan, expires_at, is_active)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(discord_id) DO UPDATE SET
        plan = excluded.plan,
        expires_at = excluded.expires_at,
        is_active = 1,
        updated_at = CURRENT_TIMESTAMP
    `).run(userId, redeemRow.plan, expiresAt?.toISOString() ?? null);

    db.prepare(`
      UPDATE redeem SET is_used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE code = ?
    `).run(userId, code);

    const planLabels = { '1month': '1 Bulan', '3months': '3 Bulan', lifetime: 'Lifetime ♾️' };

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Redeem Berhasil!')
      .setDescription(`${SEPARATOR}\n\n🎉 Selamat! Kamu berhasil mengaktifkan **Premium**!\n\n${SEPARATOR}`)
      .addFields(
        { name: '📦 Paket', value: planLabels[redeemRow.plan] || redeemRow.plan, inline: true },
        { name: '📅 Berakhir', value: expiresAt ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:F>` : '♾️ Selamanya', inline: true },
      )
      .setFooter({ text: `${config.bot.name}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
