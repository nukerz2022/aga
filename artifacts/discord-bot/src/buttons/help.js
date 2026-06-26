import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../config/config.js';
import { SEPARATOR } from '../utils/embed.js';

export default {
  customId: 'help',

  async execute(interaction) {
    const { prices } = config.payment;

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('💎 Paket Premium')
      .setDescription(`${SEPARATOR}\n\nGunakan \`/subscribe\` untuk info lengkap!\n\n${SEPARATOR}`)
      .addFields(
        { name: '📦 1 Bulan', value: `Rp ${prices['1month'].toLocaleString('id-ID')}`, inline: true },
        { name: '📦 3 Bulan', value: `Rp ${prices['3months'].toLocaleString('id-ID')}`, inline: true },
        { name: '♾️ Lifetime', value: `Rp ${prices.lifetime.toLocaleString('id-ID')}`, inline: true },
      )
      .setFooter({ text: `${config.bot.name}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('bayar:1month')
        .setLabel('💳 1 Bulan')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('bayar:3months')
        .setLabel('💳 3 Bulan')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('bayar:lifetime')
        .setLabel('⭐ Lifetime')
        .setStyle(ButtonStyle.Success),
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
