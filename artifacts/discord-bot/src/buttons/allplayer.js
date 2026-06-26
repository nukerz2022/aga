import { getAllPlayers } from '../services/fivem/playerService.js';
import { createErrorEmbed } from '../utils/embed.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../config/config.js';
import { SEPARATOR } from '../utils/embed.js';

const PER_PAGE = 20;

export default {
  customId: 'allplayer',

  async execute(interaction) {
    const [, action, cfx, pageStr] = interaction.customId.split(':');
    let page = parseInt(pageStr) || 1;

    if (action === 'next') page += 1;
    else if (action === 'prev') page = Math.max(1, page - 1);

    await interaction.deferUpdate();

    try {
      const { players, serverData } = await getAllPlayers(cfx);
      const hostname = serverData?.Data?.hostname?.replace(/\^[0-9]/g, '') || cfx;
      const totalPages = Math.ceil(players.length / PER_PAGE);
      const safePage = Math.min(Math.max(1, page), totalPages);
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
      await interaction.editReply({ embeds: [createErrorEmbed('Error', err.message)], components: [] });
    }
  },
};
