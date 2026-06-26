import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getServerList } from '../../services/fivem/serverService.js';
import { createErrorEmbed, SEPARATOR } from '../../utils/embed.js';
import { config } from '../../config/config.js';
import { getDb } from '../../database/db.js';

const PER_PAGE = 10;

export default {
  data: new SlashCommandBuilder()
    .setName('serverlist')
    .setDescription('📋 Daftar server FiveM yang tersedia')
    .addIntegerOption(opt =>
      opt.setName('halaman').setDescription('Nomor halaman').setRequired(false).setMinValue(1)
    ),
  cooldown: 5,

  async execute(interaction) {
    const db = getDb();
    const page = interaction.options.getInteger('halaman') || 1;
    await interaction.deferReply();

    try {
      const { servers, total, page: curPage } = await getServerList(db, page, PER_PAGE);
      const totalPages = Math.ceil(total / PER_PAGE);

      if (!servers.length) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Tidak Ada Server', 'Belum ada server di database.')],
        });
      }

      const lines = servers.map((s, i) => {
        const idx = (curPage - 1) * PER_PAGE + i + 1;
        const aliasLine = s.alias
          ? `\n   └ 🏷️ Alias: \`${s.alias.split(',').map(a => a.trim()).join('` · `')}\``
          : '';
        return `**${idx}.** 🟢 **${s.name || 'Unknown'}**\n   └ 📡 \`${s.endpoint || s.cfx_code}\`${aliasLine}`;
      });

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle('📋 Daftar Server FiveM')
        .setDescription(
          `${SEPARATOR}\n\n${lines.join('\n\n')}\n\n${SEPARATOR}\n\n` +
          `> Ketik nama atau alias server di \`/player\`, \`/checkstatus\`, dll — autocomplete akan muncul!`
        )
        .addFields(
          { name: '📊 Total Server', value: `\`${total}\``, inline: true },
          { name: '📄 Halaman', value: `\`${curPage}/${totalPages || 1}\``, inline: true },
        )
        .setFooter({ text: `${config.bot.name} • Gunakan /checkstatus untuk cek status server` })
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
      await interaction.editReply({
        embeds: [createErrorEmbed('Gagal Mengambil Data', `\`${err.message}\``)],
      });
    }
  },
};
