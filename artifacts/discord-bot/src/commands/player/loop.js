import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { requirePremium } from '../../middlewares/premiumChecker.js';
import { findPlayerByName, autocompleteServer } from '../../services/fivem/playerService.js';
import { createErrorEmbed, createSuccessEmbed, createWarningEmbed, SEPARATOR } from '../../utils/embed.js';
import { config } from '../../config/config.js';
import { getDb } from '../../database/db.js';
import logger from '../../utils/logger.js';

const activeLoops = new Map();

export function getActiveLoops() {
  return activeLoops;
}

export default {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('🔁 Auto monitoring player — notif saat player ditemukan')
    .addStringOption(opt =>
      opt.setName('server').setDescription('CFX Code server').setRequired(true).setAutocomplete(true)
    )
    .addStringOption(opt =>
      opt.setName('nama').setDescription('Nama player yang dimonitor').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('interval').setDescription(`Interval cek (detik, min ${config.loop.minInterval})`).setRequired(false)
        .setMinValue(config.loop.minInterval).setMaxValue(config.loop.maxInterval)
    ),
  cooldown: 15,

  async autocomplete(interaction) {
    const db = getDb();
    const query = interaction.options.getFocused();
    const servers = await autocompleteServer(query, db);
    await interaction.respond(
      servers.map(s => ({ name: `${s.name || s.cfx_code} (${s.cfx_code})`, value: s.cfx_code }))
    );
  },

  async execute(interaction) {
    const { isPremium, embed: premiumEmbed } = requirePremium(interaction);
    if (!isPremium) return interaction.reply({ embeds: [premiumEmbed], ephemeral: true });

    const db = getDb();
    const cfx = interaction.options.getString('server');
    const nama = interaction.options.getString('nama');
    const interval = (interaction.options.getInteger('interval') || 60) * 1000;
    const userId = interaction.user.id;

    if (activeLoops.has(userId)) {
      return interaction.reply({
        embeds: [createWarningEmbed('Loop Aktif', 'Kamu sudah memiliki loop aktif. Gunakan `/stoploop` untuk menghentikannya.')],
        ephemeral: true,
      });
    }

    await interaction.reply({
      embeds: [createSuccessEmbed(
        'Loop Monitoring Dimulai',
        `🔍 Memantau **${nama}** di server \`${cfx}\`\n⏱️ Interval: setiap \`${interval / 1000} detik\`\n\nGunakan \`/stoploop\` untuk menghentikan.`
      )],
    });

    db.prepare(`
      INSERT OR REPLACE INTO loopfinder (discord_id, channel_id, guild_id, cfx_code, target_name, interval_seconds)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, interaction.channelId, interaction.guildId, cfx, nama, interval / 1000);

    const timer = setInterval(async () => {
      try {
        const { found, serverData, endpoint } = await findPlayerByName(cfx, nama);
        if (found.length) {
          const hostname = serverData?.Data?.hostname?.replace(/\^[0-9]/g, '') || cfx;
          const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🟢 PLAYER FOUND!')
            .setDescription(`${SEPARATOR}\n\n🔔 <@${userId}> Player **${nama}** ditemukan!\n\n${SEPARATOR}`)
            .addFields(
              { name: '🎮 Server', value: `\`${hostname}\``, inline: true },
              { name: '🆔 ID', value: `\`${found[0].id}\``, inline: true },
              { name: '📶 Ping', value: `\`${found[0].ping ?? 'N/A'}ms\``, inline: true },
            )
            .setFooter({ text: `${config.bot.name} • Loop Monitor` })
            .setTimestamp();

          await interaction.followUp({ content: `<@${userId}>`, embeds: [embed] });
          clearInterval(timer);
          activeLoops.delete(userId);
          db.prepare(`UPDATE loopfinder SET is_active = 0 WHERE discord_id = ?`).run(userId);
        }
      } catch (err) {
        logger.warn(`[Loop] Error for ${userId}: ${err.message}`);
      }
    }, interval);

    activeLoops.set(userId, timer);
  },
};
