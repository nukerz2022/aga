import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getSteamProfile } from '../../services/steam/steamService.js';
import { createErrorEmbed, SEPARATOR } from '../../utils/embed.js';
import { config } from '../../config/config.js';

function onlineEmoji(state) {
  if (state === 'online') return '🟢';
  if (state === 'in-game') return '🎮';
  return '⚫';
}

export default {
  data: new SlashCommandBuilder()
    .setName('steam')
    .setDescription('🎯 Cari profil Steam berdasarkan SteamID64 atau vanity URL')
    .addStringOption(opt =>
      opt.setName('input')
        .setDescription('SteamID64, vanity URL, atau link profil Steam')
        .setRequired(true)
    ),
  cooldown: 5,

  async execute(interaction) {
    const input = interaction.options.getString('input');
    await interaction.deferReply();

    try {
      const profile = await getSteamProfile(input);

      const privacyLabel = {
        public: '🌐 Public',
        friendsonly: '👥 Friends Only',
        private: '🔒 Private',
      }[profile.privacyState] ?? (profile.privacyState || 'N/A');

      const embed = new EmbedBuilder()
        .setColor(profile.vacBanned ? config.colors.danger : config.colors.primary)
        .setTitle(`${onlineEmoji(profile.onlineState)} ${profile.steamId || 'Steam Profile'}`)
        .setDescription(`${SEPARATOR}`)
        .setThumbnail(profile.avatarFull || null)
        .addFields(
          { name: '👤 Real Name', value: profile.realname || 'N/A', inline: true },
          { name: '📍 Lokasi', value: profile.location || 'N/A', inline: true },
          { name: '📅 Member Since', value: profile.memberSince || 'N/A', inline: true },
          { name: '🔒 Privacy', value: privacyLabel, inline: true },
          { name: '🚦 Status', value: profile.stateMessage || profile.onlineState || 'N/A', inline: true },
          { name: '🏷️ Headline', value: profile.headline || 'N/A', inline: true },
          { name: '🆔 SteamID64', value: profile.steamId64 ? `\`${profile.steamId64}\`` : 'N/A', inline: false },
          {
            name: '⚠️ Status Akun',
            value: [
              profile.vacBanned ? '🔴 **VAC BANNED**' : '✅ Tidak VAC Ban',
              profile.tradeBanState && profile.tradeBanState !== 'None'
                ? `🔴 Trade Ban: ${profile.tradeBanState}`
                : '✅ Trade OK',
              profile.isLimited ? '⚠️ Akun Limited' : '✅ Akun Normal',
            ].join('\n'),
            inline: false,
          },
        )
        .setFooter({ text: `${config.bot.name} • Steam Lookup` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('🔗 Buka Profil Steam')
          .setStyle(ButtonStyle.Link)
          .setURL(profile.profileUrl),
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      await interaction.editReply({
        embeds: [createErrorEmbed(
          'Steam Profile Tidak Ditemukan',
          `\`${err.message}\`\n\nPastikan SteamID64 atau vanity URL yang kamu masukkan benar.`
        )],
      });
    }
  },
};
