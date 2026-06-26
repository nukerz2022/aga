export default {
  customId: 'placeholder_menu',
  async execute(interaction) {
    await interaction.reply({ content: 'Select menu handler loaded.', ephemeral: true });
  },
};
