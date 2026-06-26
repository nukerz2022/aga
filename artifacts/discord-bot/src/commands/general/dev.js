import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { requireOwner } from '../../middlewares/permissionChecker.js';
import { config } from '../../config/config.js';
import { SEPARATOR } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dev')
    .setDescription('👨‍💻 Informasi Developer'),
  cooldown: 10,

  async execute(interaction, client) {
    const { allowed, embed: ownerEmbed } = requireOwner(interaction);
    if (!allowed) return interaction.reply({ embeds: [ownerEmbed], ephemeral: true });

    const guilds = client.guilds.cache.size;
    let totalUsers = 0;
    client.guilds.cache.forEach(g => { totalUsers += g.memberCount; });

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('👨‍💻 Developer Info')
      .setDescription(`${SEPARATOR}\n\n**${config.bot.name}** adalah Discord bot premium untuk mencari pemain FiveM secara real-time.\n\n${SEPARATOR}`)
      .addFields(
        { name: '🤖 Bot Name', value: `\`${config.bot.name}\``, inline: true },
        { name: '📦 Version', value: `\`v${config.bot.version}\``, inline: true },
        { name: '⚡ Framework', value: '`discord.js v14`', inline: true },
        { name: '🖥️ Runtime', value: '`Node.js 22 LTS`', inline: true },
        { name: '🏠 Servers', value: `\`${guilds}\``, inline: true },
        { name: '👥 Users', value: `\`${totalUsers.toLocaleString()}\``, inline: true },
        { name: '📡 API', value: '`FiveM Official API`', inline: true },
        { name: '💾 Database', value: '`SQLite`', inline: true },
        { name: '⏱️ Uptime', value: `\`${formatUptime(process.uptime())}\``, inline: true },
      )
      .setFooter({ text: `${config.bot.name} • v${config.bot.version}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🔗 Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL(config.discord.supportServer),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');
}
