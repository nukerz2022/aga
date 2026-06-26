import { EmbedBuilder } from 'discord.js';
import { getDb } from '../database/db.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embed.js';
import { config } from '../config/config.js';
import logger from '../utils/logger.js';

export default {
  customId: 'requestserver',

  async execute(interaction, client) {
    const cfxCode = interaction.fields.getTextInputValue('cfx_code').trim();
    const serverName = interaction.fields.getTextInputValue('server_name').trim();
    const reason = interaction.fields.getTextInputValue('reason')?.trim() || '-';

    await interaction.deferReply({ ephemeral: true });

    const db = getDb();
    const existing = db.prepare(`SELECT id FROM servers WHERE cfx_code = ?`).get(cfxCode);

    if (existing) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Server Sudah Ada', `Server \`${cfxCode}\` sudah ada di database kami.`)],
      });
    }

    const adminEmbed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('📨 Request Server Baru')
      .addFields(
        { name: '👤 Dari', value: `<@${interaction.user.id}>`, inline: true },
        { name: '🆔 CFX Code', value: `\`${cfxCode}\``, inline: true },
        { name: '🏷️ Nama Server', value: serverName },
        { name: '📝 Alasan', value: reason },
      )
      .setFooter({ text: config.bot.name })
      .setTimestamp();

    if (config.payment.adminId) {
      try {
        const admin = await client.users.fetch(config.payment.adminId);
        await admin.send({ embeds: [adminEmbed] });
      } catch (err) {
        logger.warn(`[RequestServer] Could not DM admin: ${err.message}`);
      }
    }

    await interaction.editReply({
      embeds: [createSuccessEmbed(
        'Request Terkirim',
        `✅ Request server **${serverName}** (\`${cfxCode}\`) berhasil dikirim!\n\nAdmin akan mereview dalam **1×24 jam**.`
      )],
    });
  },
};
