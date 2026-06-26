import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../../config/config.js';
import { SEPARATOR } from '../../utils/embed.js';
import { getDb } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bayar')
    .setDescription('💳 Lakukan pembayaran QRIS')
    .addStringOption(opt =>
      opt.setName('paket')
        .setDescription('Pilih paket subscription')
        .setRequired(true)
        .addChoices(
          { name: '📦 1 Bulan', value: '1month' },
          { name: '📦 3 Bulan', value: '3months' },
          { name: '♾️ Lifetime', value: 'lifetime' },
        )
    ),
  cooldown: 5,

  async execute(interaction) {
    const paket = interaction.options.getString('paket');
    const { prices, qrisImageUrl } = config.payment;
    const price = prices[paket];

    const labels = { '1month': '1 Bulan', '3months': '3 Bulan', lifetime: 'Lifetime' };
    const label = labels[paket];

    const db = getDb();
    db.prepare(`
      INSERT INTO payments (discord_id, plan, amount, status)
      VALUES (?, ?, ?, 'pending')
    `).run(interaction.user.id, paket, price);

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('💳 Pembayaran QRIS')
      .setDescription(`${SEPARATOR}\n\n📦 Paket: **${label}**\n💰 Nominal: **Rp ${price.toLocaleString('id-ID')}**\n\n${SEPARATOR}`)
      .addFields(
        {
          name: '📝 Cara Bayar',
          value: [
            `1️⃣ Scan QRIS di bawah`,
            `2️⃣ Transfer tepat **Rp ${price.toLocaleString('id-ID')}**`,
            `3️⃣ Screenshot bukti bayar`,
            `4️⃣ Kirim screenshot ke admin`,
          ].join('\n'),
        },
        {
          name: '⚠️ Penting',
          value: 'Transfer **tepat** sesuai nominal agar mudah diverifikasi.\nPembayaran diverifikasi dalam **1×24 jam**.',
        },
      )
      .setFooter({ text: `${config.bot.name} • ${interaction.user.tag}` })
      .setTimestamp();

    if (qrisImageUrl) embed.setImage(qrisImageUrl);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`konfirm:${paket}`)
        .setLabel('✅ Sudah Bayar — Kirim Bukti')
        .setStyle(ButtonStyle.Success),
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
