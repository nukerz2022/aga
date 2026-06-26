import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export default {
  customId: 'konfirm',

  async execute(interaction) {
    const [, paket] = interaction.customId.split(':');

    const modal = new ModalBuilder()
      .setCustomId(`konfirmbayar:${paket}`)
      .setTitle('✅ Konfirmasi Pembayaran');

    const proofInput = new TextInputBuilder()
      .setCustomId('proof_url')
      .setLabel('Link Screenshot Bukti Bayar')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://imgur.com/...')
      .setRequired(true);

    const noteInput = new TextInputBuilder()
      .setCustomId('note')
      .setLabel('Catatan (opsional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Nama pengirim, waktu transfer, dll')
      .setRequired(false)
      .setMaxLength(200);

    modal.addComponents(
      new ActionRowBuilder().addComponents(proofInput),
      new ActionRowBuilder().addComponents(noteInput),
    );

    await interaction.showModal(modal);
  },
};
