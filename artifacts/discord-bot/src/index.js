import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { loadButtons, loadSelectMenus, loadModals } from './handlers/buttonHandler.js';
import { initDb } from './database/db.js';
import { startKeepaliveServer } from './server/keepalive.js';
import logger from './utils/logger.js';
import { config } from './config/config.js';

if (!config.discord.token) {
  logger.error('[Bot] DISCORD_TOKEN tidak ditemukan di .env!');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

async function bootstrap() {
  logger.info(`[Bot] Starting ${config.bot.name} v${config.bot.version}...`);

  await initDb();

  await loadCommands(client);
  await loadEvents(client);
  await loadButtons(client);
  await loadSelectMenus(client);
  await loadModals(client);

  await client.login(config.discord.token);

  // Start HTTP keepalive server after login so /health shows correct guild count
  startKeepaliveServer(client);
}

process.on('unhandledRejection', (err) => {
  logger.error(`[UnhandledRejection] ${err?.message ?? err}`, { stack: err?.stack });
});

process.on('uncaughtException', (err) => {
  logger.error(`[UncaughtException] ${err.message}`, { stack: err?.stack });
  process.exit(1);
});

bootstrap().catch((err) => {
  logger.error(`[Bootstrap] Fatal error: ${err.message}`);
  process.exit(1);
});
