import 'dotenv/config';

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    ownerId: process.env.OWNER_ID,
    supportServer: process.env.SUPPORT_SERVER || 'https://discord.gg/support',
    supportServerId: process.env.SUPPORT_SERVER_ID,
  },
  bot: {
    name: process.env.BOT_NAME || 'STRONAUT',
    version: process.env.BOT_VERSION || '5.0.0',
  },
  database: {
    path: process.env.DB_PATH || './src/database/database.sqlite',
  },
  fivem: {
    apiBase: process.env.FIVEM_API_BASE || 'https://servers-frontend.fivem.net/api/servers/single',
    timeout: parseInt(process.env.FIVEM_API_TIMEOUT) || 10000,
    retries: 3,
  },
  payment: {
    qrisImageUrl: process.env.QRIS_IMAGE_URL || '',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 30000,
    serverTtl: parseInt(process.env.SERVER_CACHE_TTL) || 60000,
  },
  loop: {
    minInterval: parseInt(process.env.LOOP_MIN_INTERVAL) || 30,
    maxInterval: parseInt(process.env.LOOP_MAX_INTERVAL) || 3600,
  },
  colors: {
    primary: 0x8B5CF6,
    success: 0x22C55E,
    danger: 0xEF4444,
    warning: 0xF59E0B,
    info: 0x3B82F6,
  },
  cooldowns: {
    default: 3,
    player: 5,
    allplayer: 10,
    loop: 15,
  },
};

export default config;
