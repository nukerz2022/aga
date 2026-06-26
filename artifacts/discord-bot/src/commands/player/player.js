import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { requirePremium } from '../../middlewares/premiumChecker.js';
import { findPlayerByName, autocompleteServer } from '../../services/fivem/playerService.js';
import { createPlayerFoundEmbed, createPlayerNotFoundEmbed, createLoadingEmbed, createErrorEmbed } from '../../utils/embed.js';
import { config } from '../../config/config.js';
import { getDb } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('🔍 Cari player berdasarkan nama')
    .addStringOption(opt =>
      opt.setName('server').setDescription('CFX Code atau nama server').setRequired(true).setAutocomplete(true)
    )
    .addStringOption(opt =>
      opt.setName('nama').setDescription('Nama player yang dicari').setRequired(true)
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
    const { isPremium, embed: premiumEmbed } = requirePremium(interaction);
    if (!isPremium) return interaction.reply({ embeds: [premiumEmbed], ephemeral: true });

    const cfx = interaction.options.getString('server');
    const nama = interaction.options.getString('nama');

    await interaction.deferReply();

    try {
      const { found, serverData, endpoint } = await findPlayerByName(cfx, nama);
      const hostname = serverData?.Data?.hostname?.replace(/\^[0-9]/g, '') || cfx;

      if (!found.length) {
        return interaction.editReply({ embeds: [createPlayerNotFoundEmbed(nama)] });
      }

      const embeds = found.slice(0, 5).map(p => createPlayerFoundEmbed(p, hostname, endpoint));

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`loop:${cfx}:${nama}`)
          .setLabel('🔁 Monitor Player')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`refresh:player:${cfx}:${nama}`)
          .setLabel('🔄 Refresh')
          .setStyle(ButtonStyle.Secondary),
      );

      await interaction.editReply({ embeds, components: [row] });
    } catch (err) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Gagal Mengambil Data', `Tidak dapat terhubung ke server \`${cfx}\`.\n\`${err.message}\``)],
      });
    }
  },
};
