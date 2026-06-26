import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Collection } from 'discord.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadButtons(client) {
  client.buttons = new Collection();
  const buttonsPath = path.join(__dirname, '../buttons');

  const files = readdirSync(buttonsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    try {
      const filePath = path.join(buttonsPath, file);
      const btn = await import(`file://${filePath}`);
      const button = btn.default || btn;

      if (!button?.customId || !button?.execute) {
        logger.warn(`[Buttons] Skipping ${file}: missing customId or execute`);
        continue;
      }

      client.buttons.set(button.customId, button);
      logger.info(`[Buttons] Loaded: ${button.customId}`);
    } catch (err) {
      logger.error(`[Buttons] Failed to load ${file}: ${err.message}`);
    }
  }
}

export async function loadSelectMenus(client) {
  client.selectMenus = new Collection();
  const menusPath = path.join(__dirname, '../selectmenus');
  const files = readdirSync(menusPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    try {
      const filePath = path.join(menusPath, file);
      const sm = await import(`file://${filePath}`);
      const menu = sm.default || sm;

      if (!menu?.customId || !menu?.execute) continue;
      client.selectMenus.set(menu.customId, menu);
      logger.info(`[SelectMenus] Loaded: ${menu.customId}`);
    } catch (err) {
      logger.error(`[SelectMenus] Failed to load ${file}: ${err.message}`);
    }
  }
}

export async function loadModals(client) {
  client.modals = new Collection();
  const modalsPath = path.join(__dirname, '../modals');
  const files = readdirSync(modalsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    try {
      const filePath = path.join(modalsPath, file);
      const md = await import(`file://${filePath}`);
      const modal = md.default || md;

      if (!modal?.customId || !modal?.execute) continue;
      client.modals.set(modal.customId, modal);
      logger.info(`[Modals] Loaded: ${modal.customId}`);
    } catch (err) {
      logger.error(`[Modals] Failed to load ${file}: ${err.message}`);
    }
  }
}
