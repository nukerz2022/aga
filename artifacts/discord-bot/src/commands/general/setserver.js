import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { requireOwner } from '../../middlewares/permissionChecker.js';
import { getDb } from '../../database/db.js';
import { config } from '../../config/config.js';
import { createSuccessEmbed, createErrorEmbed, SEPARATOR } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setserver')
    .setDescription('🛠️ [Owner] Edit info server di database')
    .addStringOption(opt =>
      opt.setName('server')
        .setDescription('Nama atau alias server yang ingin diedit')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(opt =>
      opt.setName('banner')
        .setDescription('URL gambar banner server (link gambar langsung)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('cfx_code')
        .setDescription('CFX Code asli server (untuk query player via FiveM API)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('nama')
        .setDescription('Ubah nama tampilan server')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('alias')
        .setDescription('Alias server (pisah dengan koma, contoh: smrp,satu mimpi)')
        .setRequired(false)
    ),
  cooldown: 3,

  async autocomplete(interaction) {
    const db = getDb();
    const query = interaction.options.getFocused().toLowerCase();
    const servers = db.prepare(
      `SELECT cfx_code, name FROM servers WHERE is_active = 1 AND (LOWER(name) LIKE ? OR LOWER(alias) LIKE ?) LIMIT 25`
    ).all(`%${query}%`, `%${query}%`);
    await interaction.respond(servers.map(s => ({ name: s.name || s.cfx_code, value: s.cfx_code })));
  },

  async execute(interaction) {
    const { allowed, embed: ownerEmbed } = requireOwner(interaction);
    if (!allowed) return interaction.reply({ embeds: [ownerEmbed], ephemeral: true });

    const cfxKey = interaction.options.getString('server');
    const banner = interaction.options.getString('banner');
    const cfxReal = interaction.options.getString('cfx_code');
    const nama = interaction.options.getString('nama');
    const alias = interaction.options.getString('alias');

    const db = getDb();
    const server = db.prepare(`SELECT * FROM servers WHERE cfx_code = ?`).get(cfxKey);
    if (!server) {
      return interaction.reply({
        embeds: [createErrorEmbed('Server Tidak Ditemukan', `Server dengan key \`${cfxKey}\` tidak ada di database.`)],
        ephemeral: true,
      });
    }

    // Apply only provided fields
    if (banner !== null) db.prepare(`UPDATE servers SET banner_url = ? WHERE cfx_code = ?`).run(banner, cfxKey);
    if (cfxReal !== null) db.prepare(`UPDATE servers SET cfx_real = ? WHERE cfx_code = ?`).run(cfxReal, cfxKey);
    if (nama !== null) db.prepare(`UPDATE servers SET name = ? WHERE cfx_code = ?`).run(nama, cfxKey);
    if (alias !== null) db.prepare(`UPDATE servers SET alias = ? WHERE cfx_code = ?`).run(alias, cfxKey);

    const updated = db.prepare(`SELECT * FROM servers WHERE cfx_code = ?`).get(cfxKey);

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle(`✅ Server Updated — ${updated.name}`)
      .setDescription(`${SEPARATOR}`)
      .addFields(
        { name: '🏷️ Nama', value: updated.name || 'N/A', inline: true },
        { name: '📡 Endpoint', value: `\`${updated.endpoint || updated.cfx_code}\``, inline: true },
        { name: '🔑 CFX Real', value: updated.cfx_real ? `\`${updated.cfx_real}\`` : '❌ Belum diset', inline: true },
        { name: '🏷️ Alias', value: updated.alias || 'N/A', inline: false },
        { name: '🖼️ Banner URL', value: updated.banner_url ? `[Lihat Banner](${updated.banner_url})` : '❌ Belum diset', inline: false },
      )
      .setFooter({ text: `${config.bot.name} • Owner Command` })
      .setTimestamp();

    if (updated.banner_url) embed.setImage(updated.banner_url);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
