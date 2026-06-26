import { SlashCommandBuilder } from 'discord.js';
import { getActiveLoops } from './loop.js';
import { createSuccessEmbed, createWarningEmbed } from '../../utils/embed.js';
import { getDb } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stoploop')
    .setDescription('⏹️ Hentikan monitoring player yang aktif'),
  cooldown: 3,

  async execute(interaction) {
    const activeLoops = getActiveLoops();
    const userId = interaction.user.id;

    if (!activeLoops.has(userId)) {
      return interaction.reply({
        embeds: [createWarningEmbed('Tidak Ada Loop', 'Kamu tidak memiliki monitoring yang aktif saat ini.')],
        ephemeral: true,
      });
    }

    clearInterval(activeLoops.get(userId));
    activeLoops.delete(userId);

    const db = getDb();
    db.prepare(`UPDATE loopfinder SET is_active = 0 WHERE discord_id = ? AND is_active = 1`).run(userId);

    await interaction.reply({
      embeds: [createSuccessEmbed('Monitoring Dihentikan', '✅ Loop monitoring telah berhasil dihentikan.')],
    });
  },
};
