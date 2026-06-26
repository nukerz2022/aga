import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../config/config.js';
import { SEPARATOR } from '../utils/embed.js';
import { getDb } from '../database/db.js';

export default {
  customId: 'bayar',

  async execute(interaction) {
    const [, paket] = interaction.customId.split(':');
    const { prices, qrisImageUrl } = config.payment;
    const price = prices[paket];
    const labels = { '1month': '1 Bulan', '3months': '3 Bulan', lifetime: 'Lifetime' };
    const label = labels[paket] || paket;

    const db = getDb();
    db.prepare(`INSERT INTO payments (discord_id, plan, amount, status) VALUES (?, ?, ?, 'pending')`)
      .run(interaction.user.id, paket, price);

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('💳 Pembayaran QRIS')
      .setDescription(`${SEPARATOR}\n\n📦 Paket: **${label}**\n💰 Nominal: **Rp ${price.toLocaleString('id-ID')}**\n\n${SEPARATOR}`)
      .addFields({
        name: '📝 Cara Bayar',
        value: `1️⃣ Scan QRIS\n2️⃣ Transfer tepat **Rp ${price.toLocaleString('id-ID')}**\n3️⃣ Screenshot bukti\n4️⃣ Klik tombol di bawah`,
      })
      .setFooter({ text: `${config.bot.name} • ${interaction.user.tag}` })
      .setTimestamp();

    if (qrisImageUrl) embed.setImage(qrisImageUrl);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`konfirm:${paket}`)
        .setLabel('✅ Sudah Bayar')
        .setStyle(ButtonStyle.Success),
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
