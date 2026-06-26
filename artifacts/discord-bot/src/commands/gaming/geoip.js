import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { createErrorEmbed, SEPARATOR } from '../../utils/embed.js';
import { config } from '../../config/config.js';

const client = axios.create({ timeout: 8000 });

export default {
  data: new SlashCommandBuilder()
    .setName('geoip')
    .setDescription('🌐 Cek lokasi & info dari sebuah IP address')
    .addStringOption(opt =>
      opt.setName('ip')
        .setDescription('IP address yang ingin dicek')
        .setRequired(true)
    ),
  cooldown: 5,

  async execute(interaction) {
    const ip = interaction.options.getString('ip').trim();
    await interaction.deferReply();

    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      return interaction.editReply({
        embeds: [createErrorEmbed('IP Tidak Valid', 'Masukkan format IP yang benar, contoh: `1.2.3.4`')],
      });
    }

    try {
      const { data } = await client.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query,mobile,proxy,hosting`);

      if (data.status === 'fail') {
        return interaction.editReply({
          embeds: [createErrorEmbed('IP Tidak Ditemukan', data.message || 'IP tidak dapat diidentifikasi.')],
        });
      }

      const flagEmoji = data.countryCode
        ? data.countryCode.toUpperCase().replace(/./g, c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0)))
        : '🌐';

      const tags = [
        data.proxy ? '🔴 **PROXY / VPN**' : null,
        data.hosting ? '🔶 **Hosting / Datacenter**' : null,
        data.mobile ? '📱 Mobile' : null,
      ].filter(Boolean);

      const embed = new EmbedBuilder()
        .setColor(data.proxy ? config.colors.danger : config.colors.primary)
        .setTitle(`🌐 GeoIP — ${data.query}`)
        .setDescription(`${SEPARATOR}`)
        .addFields(
          { name: `${flagEmoji} Negara`, value: `${data.country} (${data.countryCode})`, inline: true },
          { name: '🏙️ Kota', value: `${data.city}, ${data.regionName}`, inline: true },
          { name: '📮 ZIP', value: data.zip || 'N/A', inline: true },
          { name: '🕐 Timezone', value: data.timezone || 'N/A', inline: true },
          { name: '📡 ISP', value: data.isp || 'N/A', inline: true },
          { name: '🏢 Org', value: data.org || 'N/A', inline: true },
          { name: '📍 Koordinat', value: `\`${data.lat}, ${data.lon}\``, inline: true },
          ...(tags.length ? [{ name: '⚠️ Deteksi', value: tags.join('\n'), inline: false }] : []),
        )
        .setFooter({ text: `${config.bot.name} • GeoIP` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Gagal Cek GeoIP', `\`${err.message}\``)],
      });
    }
  },
};
