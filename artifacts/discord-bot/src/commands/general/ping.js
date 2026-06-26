import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Cek latency bot'),
  cooldown: 5,

  async execute(interaction, client) {
    const sent = await interaction.reply({ content: '⏳ Menghitung...', fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const ws = client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(ws < 100 ? config.colors.success : ws < 200 ? config.colors.warning : config.colors.danger)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '📡 WebSocket', value: `\`${ws}ms\``, inline: true },
        { name: '🔁 Roundtrip', value: `\`${roundtrip}ms\``, inline: true },
        { name: '💾 Status', value: ws < 100 ? '🟢 Excellent' : ws < 200 ? '🟡 Good' : '🔴 High Latency', inline: true },
      )
      .setFooter({ text: `${config.bot.name} • v${config.bot.version}` })
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
