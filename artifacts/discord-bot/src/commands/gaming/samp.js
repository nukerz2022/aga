import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { querySampServer } from '../../services/samp/sampQuery.js';
import { createErrorEmbed, SEPARATOR } from '../../utils/embed.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('samp')
    .setDescription('🎮 Query informasi server SA-MP / Open.MP')
    .addStringOption(opt =>
      opt.setName('ip')
        .setDescription('IP atau domain server SA-MP')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('port')
        .setDescription('Port server (default: 7777)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(65535)
    ),
  cooldown: 5,

  async execute(interaction) {
    const ip = interaction.options.getString('ip');
    const port = interaction.options.getInteger('port') || 7777;
    await interaction.deferReply();

    try {
      const data = await querySampServer(ip, port);

      function buildBar(cur, max) {
        if (!max) return '░'.repeat(10);
        const filled = Math.min(10, Math.round((cur / max) * 10));
        return '█'.repeat(filled) + '░'.repeat(10 - filled);
      }

      const bar = buildBar(data.players, data.maxPlayers);

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('🟢 SA-MP / Open.MP SERVER ONLINE')
        .setDescription(`${SEPARATOR}`)
        .addFields(
          { name: '🏷️ Hostname', value: `\`${data.hostname}\``, inline: false },
          { name: '👥 Players', value: `${bar}\n\`${data.players}/${data.maxPlayers}\``, inline: false },
          { name: '🎮 Gamemode', value: `\`${data.gamemode || 'N/A'}\``, inline: true },
          { name: '🌐 Language', value: `\`${data.language || 'N/A'}\``, inline: true },
          { name: '🔒 Password', value: data.password ? '🔒 Yes' : '🔓 No', inline: true },
          { name: '🔗 Connect', value: `\`/connect ${ip}:${port}\``, inline: false },
        )
        .setFooter({ text: `${config.bot.name} • SA-MP Query` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.danger)
        .setTitle('🔴 SERVER OFFLINE / TIDAK TERSEDIA')
        .setDescription(`${SEPARATOR}\n\nServer \`${ip}:${port}\` tidak dapat dijangkau.\n\`${err.message}\``)
        .setFooter({ text: `${config.bot.name} • SA-MP Query` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
