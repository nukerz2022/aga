import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadEvents(client) {
  const eventsPath = path.join(__dirname, '../events');
  const files = readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  let loaded = 0;

  for (const file of files) {
    try {
      const filePath = path.join(eventsPath, file);
      const event = await import(`file://${filePath}`);
      const ev = event.default || event;

      if (!ev?.name || !ev?.execute) {
        logger.warn(`[Events] Skipping ${file}: missing name or execute`);
        continue;
      }

      if (ev.once) {
        client.once(ev.name, (...args) => ev.execute(...args, client));
      } else {
        client.on(ev.name, (...args) => ev.execute(...args, client));
      }

      loaded++;
      logger.info(`[Events] Loaded: ${ev.name}`);
    } catch (err) {
      logger.error(`[Events] Failed to load ${file}: ${err.message}`);
    }
  }

  logger.info(`[Events] Total loaded: ${loaded}`);
}
