import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../../config/config.js';
import { SEPARATOR } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('🆘 Link Discord Support Server'),
  cooldown: 10,

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🆘 Support Server')
      .setDescription(
        `${SEPARATOR}\n\nButuh bantuan? Bergabunglah ke **Support Server** kami!\n\nTim kami siap membantu 24/7.\n\n${SEPARATOR}`
      )
      .addFields(
        { name: '🔗 Invite Link', value: config.discord.supportServer },
        { name: '⏰ Response Time', value: '`< 24 jam`', inline: true },
        { name: '🌐 Bahasa', value: '`Bahasa Indonesia`', inline: true },
      )
      .setFooter({ text: `${config.bot.name} • v${config.bot.version}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🔗 Join Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL(config.discord.supportServer),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
