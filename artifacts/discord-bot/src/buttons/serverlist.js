import { getDb } from '../database/db.js';
import { getServerList } from '../services/fivem/serverService.js';
import { createErrorEmbed, SEPARATOR } from '../utils/embed.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../config/config.js';

const PER_PAGE = 10;

export default {
  customId: 'serverlist',

  async execute(interaction) {
    const [, action, pageStr] = interaction.customId.split(':');
    let page = parseInt(pageStr) || 1;

    if (action === 'next') page += 1;
    else if (action === 'prev') page = Math.max(1, page - 1);

    await interaction.deferUpdate();

    const db = getDb();
    try {
      const { servers, total, page: curPage } = await getServerList(db, page, PER_PAGE);
      const totalPages = Math.ceil(total / PER_PAGE);

      const lines = servers.map((s, i) => {
        const idx = (curPage - 1) * PER_PAGE + i + 1;
        return `\`${idx}\` **${s.name || 'Unknown'}** — \`${s.cfx_code}\``;
      });

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle('📋 Daftar Server FiveM')
        .setDescription(`${SEPARATOR}\n\n${lines.join('\n')}\n\n${SEPARATOR}`)
        .addFields(
          { name: '📊 Total Server', value: `\`${total}\``, inline: true },
          { name: '📄 Halaman', value: `\`${curPage}/${totalPages || 1}\``, inline: true },
        )
        .setFooter({ text: `${config.bot.name}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`serverlist:prev:${curPage}`)
          .setLabel('◀ Prev')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(curPage <= 1),
        new ButtonBuilder()
          .setCustomId(`serverlist:next:${curPage}`)
          .setLabel('Next ▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(curPage >= totalPages),
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      await interaction.editReply({ embeds: [createErrorEmbed('Error', err.message)], components: [] });
    }
  },
};
