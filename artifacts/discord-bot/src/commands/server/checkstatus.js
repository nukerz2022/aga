import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getServerStatus } from '../../services/fivem/serverService.js';
import { createServerEmbed, createServerOfflineEmbed, createErrorEmbed } from '../../utils/embed.js';
import { autocompleteServer } from '../../services/fivem/playerService.js';
import { getDb } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('checkstatus')
    .setDescription('📡 Cek status server FiveM')
    .addStringOption(opt =>
      opt.setName('server').setDescription('CFX Code server').setRequired(true).setAutocomplete(true)
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
    await interaction.deferReply();

    try {
      const status = await getServerStatus(cfx);

      if (!status.online) {
        return interaction.editReply({ embeds: [createServerOfflineEmbed(cfx)] });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`refresh:status:${cfx}`)
          .setLabel('🔄 Refresh')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`allplayer:view:${cfx}:1`)
          .setLabel('👥 Lihat Players')
          .setStyle(ButtonStyle.Primary),
      );

      await interaction.editReply({
        embeds: [createServerEmbed(status.serverData, cfx)],
        components: [row],
      });
    } catch (err) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Gagal Cek Status', `\`${err.message}\``)],
      });
    }
  },
};
