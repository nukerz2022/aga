import {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} from 'discord.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('requestserver')
    .setDescription('📨 Request penambahan server FiveM ke database'),
  cooldown: 30,

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('requestserver')
      .setTitle('📨 Request Server FiveM');

    const cfxInput = new TextInputBuilder()
      .setCustomId('cfx_code')
      .setLabel('CFX Code / IP Server')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Contoh: abc123 atau 1.2.3.4:30120')
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(50);

    const nameInput = new TextInputBuilder()
      .setCustomId('server_name')
      .setLabel('Nama Server')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Nama server FiveM')
      .setRequired(true)
      .setMaxLength(100);

    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('Alasan Request')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Kenapa server ini perlu ditambahkan?')
      .setRequired(false)
      .setMaxLength(300);

    modal.addComponents(
      new ActionRowBuilder().addComponents(cfxInput),
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(reasonInput),
    );

    await interaction.showModal(modal);
  },
};
