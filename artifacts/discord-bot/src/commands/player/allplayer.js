import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getAllPlayers, autocompleteServer } from '../../services/fivem/playerService.js';
import { createErrorEmbed, createPaginationEmbed, SEPARATOR } from '../../utils/embed.js';
import { config } from '../../config/config.js';
import { getDb } from '../../database/db.js';

const PER_PAGE = 20;

export default {
  data: new SlashCommandBuilder()
    .setName('allplayer')
    .setDescription('👥 Lihat semua player yang sedang online')
    .addStringOption(opt =>
      opt.setName('server').setDescription('CFX Code server').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt.setName('halaman').setDescription('Nomor halaman').setRequired(false).setMinValue(1)
    ),
  cooldown: 10,

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
    const page = interaction.options.getInteger('halaman') || 1;

    await interaction.deferReply();

    try {
      const { players, serverData } = await getAllPlayers(cfx);
      const hostname = serverData?.Data?.hostname?.replace(/\^[0-9]/g, '') || cfx;

      if (!players.length) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Server Kosong', `Tidak ada player online di server \`${cfx}\`.`)],
        });
      }

      const totalPages = Math.ceil(players.length / PER_PAGE);
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * PER_PAGE;
      const pageItems = players.slice(start, start + PER_PAGE);

      const lines = pageItems.map((p, i) =>
        `\`${start + i + 1}\` **${p.name}** — ID: \`${p.id}\` | 📶 \`${p.ping ?? '?'}ms\``
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`👥 Players Online — ${hostname}`)
        .setDescription(`${SEPARATOR}\n\n${lines.join('\n')}\n\n${SEPARATOR}`)
        .addFields(
          { name: '📊 Total', value: `\`${players.length}\` players`, inline: true },
          { name: '📄 Halaman', value: `\`${safePage}/${totalPages}\``, inline: true },
        )
        .setFooter({ text: `${config.bot.name} • v${config.bot.version}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`allplayer:prev:${cfx}:${safePage}`)
          .setLabel('◀ Prev')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(safePage <= 1),
        new ButtonBuilder()
          .setCustomId(`allplayer:refresh:${cfx}:${safePage}`)
          .setLabel('🔄 Refresh')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`allplayer:next:${cfx}:${safePage}`)
          .setLabel('Next ▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(safePage >= totalPages),
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Gagal Mengambil Data', `\`${err.message}\``)],
      });
    }
  },
};
