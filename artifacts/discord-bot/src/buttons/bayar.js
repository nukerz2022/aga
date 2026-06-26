import { EmbedBuilder } from 'discord.js';
import { config } from '../config/config.js';
import { SEPARATOR } from '../utils/embed.js';

export default {
  customId: 'help',

  async execute(interaction) {
    const { qrisImageUrl } = config.payment;

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('💳 Support STRONAUT Bot')
      .setDescription(
        `${SEPARATOR}\n\nTerima kasih sudah menggunakan **STRONAUT Bot**!\n\nJika bot ini berguna buat kamu, kamu bisa bantu support pengembangan dengan donasi sukarela via QRIS.\n\n${SEPARATOR}`
      )
      .addFields(
        {
          name: '📝 Cara Donasi',
          value: [
            '1️⃣ Scan QRIS menggunakan e-wallet / mobile banking apapun',
            '2️⃣ Masukkan nominal sesuai kemampuan kamu',
            '3️⃣ Selesaikan pembayaran',
            '4️⃣ Terima kasih sudah support! 🙏',
          ].join('\n'),
        },
        {
          name: '💡 Info',
          value: '> Donasi bersifat **sukarela** dan tidak wajib.\n> Semua fitur bot tetap **gratis untuk semua** pengguna.',
        },
      )
      .setFooter({ text: `${config.bot.name} • Support Kami` })
      .setTimestamp();

    if (qrisImageUrl) {
      embed.setImage(qrisImageUrl);
    } else {
      embed.addFields({ name: '⚠️ QRIS', value: 'QRIS belum dikonfigurasi. Hubungi admin.' });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
