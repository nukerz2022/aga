import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../../config/config.js';
import { SEPARATOR } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('subscribe')
    .setDescription('💎 Informasi paket subscription premium'),
  cooldown: 5,

  async execute(interaction) {
    const { prices } = config.payment;

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('💎 Paket Premium FiveM Player Finder')
      .setDescription(`${SEPARATOR}\n\nNikmati fitur lengkap pencarian player FiveM dengan berlangganan premium!\n\n${SEPARATOR}`)
      .addFields(
        {
          name: '📦 Paket 1 Bulan',
          value: [
            `💰 Harga: **Rp ${prices['1month'].toLocaleString('id-ID')}**`,
            '✅ Akses semua fitur premium',
            '✅ Player Finder tak terbatas',
            '✅ Loop Monitoring',
          ].join('\n'),
          inline: true,
        },
        {
          name: '📦 Paket 3 Bulan',
          value: [
            `💰 Harga: **Rp ${prices['3months'].toLocaleString('id-ID')}**`,
            '✅ Semua fitur 1 bulan',
            '✅ Hemat lebih banyak',
            '🔥 Populer!',
          ].join('\n'),
          inline: true,
        },
        {
          name: '♾️ Paket Lifetime',
          value: [
            `💰 Harga: **Rp ${prices.lifetime.toLocaleString('id-ID')}**`,
            '✅ Semua fitur selamanya',
            '✅ Prioritas support',
            '⭐ Best Value!',
          ].join('\n'),
          inline: true,
        },
        {
          name: SEPARATOR,
          value: '\u200B',
        },
        {
          name: '🎁 Cara Berlangganan',
          value: [
            '1️⃣ Gunakan `/bayar` untuk melihat QRIS',
            '2️⃣ Transfer sesuai paket yang dipilih',
            '3️⃣ Screenshot bukti bayar & kirim ke admin',
            '4️⃣ Atau gunakan `/redeem` jika punya kode',
          ].join('\n'),
        },
      )
      .setFooter({ text: `${config.bot.name} • v${config.bot.version}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('bayar:1month')
        .setLabel('💳 Bayar 1 Bulan')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('bayar:3months')
        .setLabel('💳 Bayar 3 Bulan')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('bayar:lifetime')
        .setLabel('⭐ Bayar Lifetime')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('redeem:open')
        .setLabel('🎁 Redeem Code')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
