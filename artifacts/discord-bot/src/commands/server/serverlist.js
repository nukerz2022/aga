import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createErrorEmbed, SEPARATOR } from '../../utils/embed.js';
import { config } from '../../config/config.js';
import { getDb } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverlist')
    .setDescription('📋 Daftar server FiveM yang tersedia'),
  cooldown: 5,

  async execute(interaction) {
    const db = getDb();
    await interaction.deferReply();

    const servers = db.prepare(`SELECT * FROM servers WHERE is_active = 1 ORDER BY name ASC`).all();

    if (!servers.length) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Tidak Ada Server', 'Belum ada server di database.')],
      });
    }

    const page = 1;
    await showPage(interaction, servers, page);
  },
};

export async function showPage(interactionOrMsg, servers, page, isUpdate = false) {
  const total = servers.length;
  const idx = Math.max(0, Math.min(page - 1, total - 1));
  const s = servers[idx];

  const aliases = s.alias
    ? s.alias.split(',').map(a => a.trim()).filter(Boolean)
    : [];

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`🎮 ${s.name || 'Server FiveM'}`)
    .setDescription(
      `${SEPARATOR}\n\n` +
      `📡 **Endpoint:** \`${s.endpoint || s.cfx_code}\`\n` +
      `🏷️ **Alias:** ${aliases.length ? aliases.map(a => `\`${a}\``).join(' · ') : 'N/A'}\n\n` +
      `> Ketik alias di command \`/player\`, \`/checkstatus\`, atau \`/allplayer\` untuk akses server ini.\n\n` +
      `${SEPARATOR}`
    )
    .addFields(
      {
        name: '💡 Cara Cari Player',
        value: `\`/player\` → ketik **${aliases[0] || s.name}** → pilih server → masukkan nama`,
        inline: false,
      },
    )
    .setFooter({ text: `${config.bot.name} • Server ${idx + 1} dari ${total}` })
    .setTimestamp();

  if (s.banner_url) {
    embed.setImage(s.banner_url);
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`serverlist:prev:${idx + 1}`)
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(idx <= 0),
    new ButtonBuilder()
      .setCustomId(`serverlist:page:${idx + 1}`)
      .setLabel(`${idx + 1} / ${total}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`serverlist:next:${idx + 1}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(idx >= total - 1),
  );

  const payload = { embeds: [embed], components: [row] };
  if (isUpdate) {
    await interactionOrMsg.update(payload);
  } else {
    await interactionOrMsg.editReply(payload);
  }
}
