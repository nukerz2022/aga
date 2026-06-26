import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import { SEPARATOR } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bayar')
    .setDescription('💳 Tampilkan QRIS untuk donasi / support bot'),
  cooldown: 10,

  async execute(interaction) {
    const { qrisImageUrl } = config.payment;

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('💳 Support STRONAUT Bot')
      .setDescription(
        `${SEPARATOR}\n\nTerima kasih sudah menggunakan **STRONAUT Bot**!\n\nJika kamu merasa bot ini berguna, kamu bisa support pengembangan bot dengan scan QRIS di bawah ini.\n\n${SEPARATOR}`
      )
      .addFields(
        {
          name: '📝 Cara Donasi',
          value: [
            '1️⃣ Scan QRIS menggunakan aplikasi e-wallet/bank apapun',
            '2️⃣ Masukkan nominal sesuai kemampuan kamu',
            '3️⃣ Selesaikan pembayaran',
            '4️⃣ Terima kasih! 🙏',
          ].join('\n'),
        },
        {
          name: '💡 Info',
          value: 'Donasi bersifat **sukarela** dan tidak wajib.\nSemua fitur bot tetap **gratis untuk semua**.',
        },
      )
      .setFooter({ text: `${config.bot.name} • Support Kami` })
      .setTimestamp();

    if (qrisImageUrl) {
      embed.setImage(qrisImageUrl);
    } else {
      embed.addFields({ name: '⚠️ QRIS', value: 'QRIS belum dikonfigurasi oleh admin.' });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
