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
    name: process.env.BOT_NAME || 'FiveM Player Finder V5',
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
    adminId: process.env.PAYMENT_ADMIN_ID || '',
    prices: {
      '1month': parseInt(process.env.PRICE_1_MONTH) || 15000,
      '3months': parseInt(process.env.PRICE_3_MONTHS) || 35000,
      lifetime: parseInt(process.env.PRICE_LIFETIME) || 99000,
    },
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
    subscribe: 5,
  },
};

export default config;
