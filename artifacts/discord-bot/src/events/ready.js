import { ActivityType } from 'discord.js';
import { getDb } from '../database/db.js';
import logger from '../utils/logger.js';
import { config } from '../config/config.js';

const activities = [
  { name: '🎮 FiveM Servers', type: ActivityType.Watching },
  { name: `👥 Players Online`, type: ActivityType.Watching },
  { name: `/help | v${config.bot.version}`, type: ActivityType.Playing },
  { name: '🔍 Mencari Player...', type: ActivityType.Playing },
  { name: '💎 Premium Available', type: ActivityType.Playing },
];

let activityIndex = 0;

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`[Bot] Logged in as ${client.user.tag}`);
    logger.info(`[Bot] Serving ${client.guilds.cache.size} guilds`);

    getDb();

    setInterval(async () => {
      try {
        const activity = activities[activityIndex % activities.length];
        let name = activity.name;

        if (activity.name.includes('Players Online')) {
          let total = 0;
          client.guilds.cache.forEach(g => { total += g.memberCount; });
          name = `👥 ${total.toLocaleString()} Members`;
        }

        client.user.setActivity(name, { type: activity.type });
        activityIndex++;
      } catch (err) {
        logger.error(`[Ready] Activity update error: ${err.message}`);
      }
    }, 30000);

    client.user.setActivity(`/help | v${config.bot.version}`, { type: ActivityType.Playing });
    logger.info('[Bot] Activity rotation started');
  },
};
