import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { createErrorEmbed, SEPARATOR } from '../../utils/embed.js';
import { config } from '../../config/config.js';

const client = axios.create({ timeout: 10000 });

const GAMES = {
  csgo: { name: 'CS:GO / CS2', appId: 730 },
  rust: { name: 'Rust', appId: 252490 },
  ark: { name: 'ARK: Survival Evolved', appId: 346110 },
  gmod: { name: 'Garry\'s Mod', appId: 4000 },
  tf2: { name: 'Team Fortress 2', appId: 440 },
  dayz: { name: 'DayZ', appId: 221100 },
};

export default {
  data: new SlashCommandBuilder()
    .setName('gameserver')
    .setDescription('🖥️ Cek status server game via Battlemetrics')
    .addStringOption(opt =>
      opt.setName('ip')
        .setDescription('IP address server')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('port')
        .setDescription('Port server')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(65535)
    )
    .addStringOption(opt =>
      opt.setName('game')
        .setDescription('Jenis game')
        .setRequired(true)
        .addChoices(
          { name: 'CS:GO / CS2', value: 'csgo' },
          { name: 'Rust', value: 'rust' },
          { name: 'ARK: Survival Evolved', value: 'ark' },
          { name: "Garry's Mod", value: 'gmod' },
          { name: 'Team Fortress 2', value: 'tf2' },
          { name: 'DayZ', value: 'dayz' },
        )
    ),
  cooldown: 8,

  async execute(interaction) {
    const ip = interaction.options.getString('ip');
    const port = interaction.options.getInteger('port');
    const game = interaction.options.getString('game');
    const gameInfo = GAMES[game];
    await interaction.deferReply();

    try {
      const { data } = await client.get(
        `https://api.battlemetrics.com/servers?filter[search]=${ip}&filter[game]=${game}&filter[ids][whitelist]=&page[size]=1`,
        { headers: { 'Accept': 'application/json' } }
      );

      const server = data?.data?.find(s =>
        s.attributes?.ip === ip && s.attributes?.port === port
      ) || data?.data?.[0];

      if (!server) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Server Tidak Ditemukan', `Server \`${ip}:${port}\` (${gameInfo.name}) tidak ditemukan di Battlemetrics.\n\nPastikan IP dan port benar.`)],
        });
      }

      const attr = server.attributes;
      const status = attr.status === 'online';

      function buildBar(cur, max) {
        if (!max) return '░'.repeat(10);
        const filled = Math.min(10, Math.round((cur / max) * 10));
        return '█'.repeat(filled) + '░'.repeat(10 - filled);
      }

      const bar = buildBar(attr.players, attr.maxPlayers);

      const embed = new EmbedBuilder()
        .setColor(status ? config.colors.success : config.colors.danger)
        .setTitle(`${status ? '🟢' : '🔴'} ${gameInfo.name} SERVER`)
        .setDescription(`${SEPARATOR}`)
        .addFields(
          { name: '🏷️ Nama', value: attr.name || 'N/A', inline: false },
          { name: '👥 Players', value: `${bar}\n\`${attr.players}/${attr.maxPlayers}\``, inline: false },
          { name: '🗺️ Map', value: `\`${attr.details?.map || 'N/A'}\``, inline: true },
          { name: '🌍 Country', value: attr.country || 'N/A', inline: true },
          { name: '📡 IP', value: `\`${attr.ip}:${attr.port}\``, inline: true },
          { name: '🔗 Battlemetrics', value: `[Lihat di Battlemetrics](https://www.battlemetrics.com/servers/${game}/${server.id})`, inline: false },
        )
        .setFooter({ text: `${config.bot.name} • Game Server Query` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Gagal Query Server', `\`${err.message}\``)],
      });
    }
  },
};
