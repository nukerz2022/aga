import { SlashCommandBuilder } from 'discord.js';
import { findPlayerById, autocompleteServer } from '../../services/fivem/playerService.js';
import { createPlayerFoundEmbed, createPlayerNotFoundEmbed, createErrorEmbed } from '../../utils/embed.js';
import { getDb } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('id')
    .setDescription('🆔 Cari player berdasarkan Server ID')
    .addStringOption(opt =>
      opt.setName('server').setDescription('CFX Code atau nama server').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt.setName('player_id').setDescription('Server ID player').setRequired(true).setMinValue(1)
    ),
  cooldown: 5,

  async autocomplete(interaction) {
    const db = getDb();
    const query = interaction.options.getFocused();
    const servers = await autocompleteServer(query, db);
    await interaction.respond(
      servers.map(s => ({ name: `${s.name || s.cfx_code} (${s.cfx_code})`, value: s.cfx_code }))
    );
  },

  async execute(interaction) {
    const cfx = interaction.options.getString('server');
    const playerId = interaction.options.getInteger('player_id');

    await interaction.deferReply();

    try {
      const { found, serverData, endpoint } = await findPlayerById(cfx, playerId);
      const hostname = serverData?.Data?.hostname?.replace(/\^[0-9]/g, '') || cfx;

      if (!found.length) {
        return interaction.editReply({ embeds: [createPlayerNotFoundEmbed(`ID: ${playerId}`)] });
      }

      await interaction.editReply({
        embeds: found.map(p => createPlayerFoundEmbed(p, hostname, endpoint)),
      });
    } catch (err) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Gagal Mengambil Data', `Tidak dapat terhubung ke server \`${cfx}\`.\n\`${err.message}\``)],
      });
    }
  },
};
