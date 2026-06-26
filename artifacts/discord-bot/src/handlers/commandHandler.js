import { Collection } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '../commands');

  const categories = readdirSync(commandsPath).filter(f =>
    statSync(path.join(commandsPath, f)).isDirectory()
  );

  let loaded = 0;

  for (const category of categories) {
    const files = readdirSync(path.join(commandsPath, category)).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const filePath = path.join(commandsPath, category, file);
        const command = await import(`file://${filePath}`);
        const cmd = command.default || command;

        if (!cmd?.data || !cmd?.execute) {
          logger.warn(`[Commands] Skipping ${file}: missing data or execute`);
          continue;
        }

        client.commands.set(cmd.data.name, cmd);
        loaded++;
        logger.info(`[Commands] Loaded: ${cmd.data.name} (${category})`);
      } catch (err) {
        logger.error(`[Commands] Failed to load ${file}: ${err.message}`);
      }
    }
  }

  logger.info(`[Commands] Total loaded: ${loaded}`);
  return client.commands;
}
