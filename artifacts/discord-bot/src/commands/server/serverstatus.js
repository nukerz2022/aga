import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getServerStatus } from '../../services/fivem/serverService.js';
import { createErrorEmbed, SEPARATOR } from '../../utils/embed.js';
import { autocompleteServer } from '../../services/fivem/playerService.js';
import { config } from '../../config/config.js';
import { getDb } from '../../database/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverstatus')
    .setDescription('📊 Detail lengkap status server FiveM')
    .addStringOption(opt =>
      opt.setName('server').setDescription('CFX Code server').setRequired(true).setAutocomplete(true)
    ),
  cooldown: 10,

  async autocomplete(interaction) {
    const db = getDb();
    const query = interaction.options.getFocused();
    const servers = await autocompleteServer(query, db);
    await interaction.respond(
      servers.map(s => ({ name: `${s.name || s.cfx_code} (${s.cfx_code})`, value: s.cfx_code }))
    );
  },

  async execute(interaction) {
    const cfx = interaction.options.getString('server');
    await interaction.deferReply();

    try {
      const status = await getServerStatus(cfx);
      if (!status.online) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Server Offline', `Server \`${cfx}\` sedang offline atau tidak dapat dijangkau.`)],
        });
      }

      const sv = status.sv;
      const vars = sv?.vars ?? {};
      const tags = vars.tags ? vars.tags.split(',').map(t => `\`${t.trim()}\``).join(' ') : 'N/A';
      const locale = vars.locale || 'N/A';
      const gametype = vars.gametype || 'N/A';
      const mapname = vars.mapname || 'N/A';
      const scriptHookAllowed = vars.sv_scriptHookAllowed === '1' ? '✅' : '❌';

      const playerBar = buildBar(status.playerCount, status.maxPlayers);

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`🟢 ${status.hostname}`)
        .setDescription(`${SEPARATOR}`)
        .addFields(
          { name: '👥 Players', value: `${playerBar}\n\`${status.playerCount}/${status.maxPlayers}\``, inline: false },
          { name: '🎮 Gametype', value: `\`${gametype}\``, inline: true },
          { name: '🗺️ Map', value: `\`${mapname}\``, inline: true },
          { name: '🌍 Locale', value: `\`${locale}\``, inline: true },
          { name: '🔄 OneSync', value: status.oneSync ? '✅ Aktif' : '❌ Nonaktif', inline: true },
          { name: '🎣 ScriptHook', value: scriptHookAllowed, inline: true },
          { name: '🏷️ Tags', value: tags, inline: false },
          { name: '🔗 Connect', value: `\`connect ${status.endpoint}\``, inline: false },
          { name: '🆔 CFX Code', value: `\`${cfx}\``, inline: true },
        )
        .setFooter({ text: `${config.bot.name} • v${config.bot.version}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Gagal Mengambil Data', `\`${err.message}\``)],
      });
    }
  },
};

function buildBar(current, max) {
  if (!max) return '░'.repeat(10);
  const filled = Math.round((current / max) * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}
