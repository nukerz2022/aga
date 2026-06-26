import { EmbedBuilder } from 'discord.js';
import { getDb } from '../database/db.js';
import { createSuccessEmbed, createErrorEmbed, SEPARATOR } from '../utils/embed.js';
import { config } from '../config/config.js';
import logger from '../utils/logger.js';

export default {
  customId: 'konfirmbayar',

  async execute(interaction, client) {
    const [, paket] = interaction.customId.split(':');
    const proofUrl = interaction.fields.getTextInputValue('proof_url');
    const note = interaction.fields.getTextInputValue('note') || '';

    const db = getDb();
    const userId = interaction.user.id;

    await interaction.deferReply({ ephemeral: true });

    db.prepare(`
      UPDATE payments SET proof_url = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP
      WHERE discord_id = ? AND plan = ? AND status = 'pending'
      ORDER BY created_at DESC LIMIT 1
    `).run(proofUrl, note, userId, paket);

    const planLabels = { '1month': '1 Bulan', '3months': '3 Bulan', lifetime: 'Lifetime' };
    const price = config.payment.prices[paket];

    const adminEmbed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('💳 Konfirmasi Pembayaran Baru!')
      .setDescription(`${SEPARATOR}\n\n📨 User <@${userId}> (${interaction.user.tag}) mengirim bukti bayar\n\n${SEPARATOR}`)
      .addFields(
        { name: '👤 User', value: `<@${userId}>`, inline: true },
        { name: '📦 Paket', value: planLabels[paket] || paket, inline: true },
        { name: '💰 Nominal', value: `Rp ${price?.toLocaleString('id-ID') || '?'}`, inline: true },
        { name: '🖼️ Bukti', value: proofUrl },
        { name: '📝 Catatan', value: note || '-' },
      )
      .setFooter({ text: config.bot.name })
      .setTimestamp();

    if (config.payment.adminId) {
      try {
        const admin = await client.users.fetch(config.payment.adminId);
        await admin.send({ embeds: [adminEmbed] });
      } catch (err) {
        logger.warn(`[Payment] Could not DM admin: ${err.message}`);
      }
    }

    await interaction.editReply({
      embeds: [createSuccessEmbed(
        'Konfirmasi Terkirim',
        `✅ Bukti bayar kamu telah dikirim ke admin!\n\nPembayaran akan diverifikasi dalam **1×24 jam**.\nGunakan \`/ceklangganan\` untuk cek status.`
      )],
    });
  },
};
