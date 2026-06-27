import { getDb } from '../database/db.js';
import { showPage } from '../commands/server/serverlist.js';

export default {
  customId: 'serverlist',

  async execute(interaction) {
    const [, action, pageStr] = interaction.customId.split(':');
    let page = parseInt(pageStr) || 1;

    if (action === 'next') page += 1;
    else if (action === 'prev') page = Math.max(1, page - 1);

    const db = getDb();
    const servers = db.prepare(`SELECT * FROM servers WHERE is_active = 1 ORDER BY name ASC`).all();

    await showPage(interaction, servers, page, true);
  },
};
