import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import axios from 'axios';
import { createErrorEmbed, SEPARATOR } from '../../utils/embed.js';
import { config } from '../../config/config.js';

const client = axios.create({ timeout: 8000 });

export default {
  data: new SlashCommandBuilder()
    .setName('minecraft')
    .setDescription('⛏️ Cek status server Minecraft (Java / Bedrock)')
    .addStringOption(opt =>
      opt.setName('host')
        .setDescription('IP atau domain server Minecraft')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('port')
        .setDescription('Port server (default: 25565 Java / 19132 Bedrock)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(65535)
    )
    .addStringOption(opt =>
      opt.setName('tipe')
        .setDescription('Tipe server')
        .setRequired(false)
        .addChoices(
          { name: 'Java Edition', value: 'java' },
          { name: 'Bedrock Edition', value: 'bedrock' },
        )
    ),
  cooldown: 5,

  async execute(interaction) {
    const host = interaction.options.getString('host');
    const port = interaction.options.getInteger('port');
    const tipe = interaction.options.getString('tipe') || 'java';
    await interaction.deferReply();

    const defaultPort = tipe === 'bedrock' ? 19132 : 25565;
    const finalPort = port || defaultPort;
    const queryHost = port ? `${host}:${finalPort}` : host;
    const apiBase = tipe === 'bedrock' ? 'https://api.mcsrvstat.us/bedrock/3' : 'https://api.mcsrvstat.us/3';

    try {
      const { data } = await client.get(`${apiBase}/${queryHost}`);

      if (!data.online) {
        const offlineEmbed = new EmbedBuilder()
          .setColor(config.colors.danger)
          .setTitle('🔴 MINECRAFT SERVER OFFLINE')
          .setDescription(`${SEPARATOR}\n\nServer \`${queryHost}\` sedang offline atau tidak dapat dijangkau.`)
          .setFooter({ text: `${config.bot.name} • Minecraft Query` })
          .setTimestamp();
        return interaction.editReply({ embeds: [offlineEmbed] });
      }

      function buildBar(cur, max) {
        if (!max) return '░'.repeat(10);
        const filled = Math.min(10, Math.round((cur / max) * 10));
        return '█'.repeat(filled) + '░'.repeat(10 - filled);
      }

      const players = data.players?.online ?? 0;
      const maxPlayers = data.players?.max ?? 0;
      const bar = buildBar(players, maxPlayers);

      const motd = data.motd?.clean?.join('\n') || 'No MOTD';
      const version = data.version || 'Unknown';
      const software = data.software || (tipe === 'bedrock' ? 'Bedrock' : 'Java');
      const icon = data.icon;

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`⛏️ ${tipe === 'bedrock' ? '🪨 Bedrock' : '☕ Java'} SERVER ONLINE`)
        .setDescription(`${SEPARATOR}`)
        .addFields(
          { name: '📝 MOTD', value: `\`\`\`${motd.slice(0, 200)}\`\`\``, inline: false },
          { name: '👥 Players', value: `${bar}\n\`${players}/${maxPlayers}\``, inline: false },
          { name: '🔧 Version', value: `\`${version}\``, inline: true },
          { name: '🖥️ Software', value: `\`${software}\``, inline: true },
          { name: '🔗 Host', value: `\`${queryHost}\``, inline: true },
        )
        .setFooter({ text: `${config.bot.name} • Minecraft Query` })
        .setTimestamp();

      if (icon) embed.setThumbnail(icon);

      const playerList = data.players?.list?.slice(0, 20);
      if (playerList?.length) {
        embed.addFields({
          name: `👤 Player Online (${playerList.length})`,
          value: playerList.map(p => `\`${p.name || p}\``).join(', '),
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Gagal Query Minecraft Server', `\`${err.message}\``)],
      });
    }
  },
};
