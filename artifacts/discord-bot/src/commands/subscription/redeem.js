import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('🎁 Redeem kode premium'),
  cooldown: 10,

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('redeem')
      .setTitle('🎁 Redeem Premium Code');

    const codeInput = new TextInputBuilder()
      .setCustomId('redeem_code')
      .setLabel('Masukkan Kode Redeem')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Contoh: FIVEM-XXXX-XXXX')
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(30);

    modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
    await interaction.showModal(modal);
  },
};
