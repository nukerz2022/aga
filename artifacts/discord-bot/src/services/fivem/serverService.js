import { fetchServerInfo, fetchPlayers, fetchDynamicInfo } from './fivemApi.js';
import { serverCache } from '../../utils/cache.js';
import { config } from '../../config/config.js';
import logger from '../../utils/logger.js';

export async function getServerStatus(cfxCode) {
  const cacheKey = `status:${cfxCode}`;
  if (serverCache.has(cacheKey)) return serverCache.get(cacheKey);

  try {
    const serverData = await fetchServerInfo(cfxCode);
    const sv = serverData?.Data;
    if (!sv) return { online: false };

    const endpoint = sv.connectEndPoints?.[0];
    let players = [];
    let dynamic = {};

    if (endpoint) {
      try {
        players = await fetchPlayers(endpoint);
        dynamic = await fetchDynamicInfo(endpoint);
      } catch { }
    }

    const result = {
      online: true,
      serverData,
      sv,
      endpoint,
      players,
      dynamic,
      hostname: sv.hostname?.replace(/\^[0-9]/g, '') || 'Unknown',
      playerCount: sv.clients ?? players.length,
      maxPlayers: sv.sv_maxclients ?? 64,
      oneSync: sv.vars?.onesync_enabled === 'true',
    };

    serverCache.set(cacheKey, result, config.cache.serverTtl);
    return result;
  } catch (err) {
    logger.warn(`[ServerService] Failed to get status for ${cfxCode}: ${err.message}`);
    return { online: false, error: err.message };
  }
}

export async function getServerList(db, page = 1, perPage = 10) {
  const offset = (page - 1) * perPage;
  const servers = db.prepare(
    `SELECT * FROM servers WHERE is_active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(perPage, offset);
  const total = db.prepare(`SELECT COUNT(*) as count FROM servers WHERE is_active = 1`).get();
  return { servers, total: total.count, page, perPage };
}

export function formatServerStatus(status) {
  const bar = (count, max) => {
    const filled = Math.round((count / max) * 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
  };

  if (!status.online) return null;
  return {
    name: status.hostname,
    players: `${status.playerCount}/${status.maxPlayers}`,
    bar: bar(status.playerCount, status.maxPlayers),
    oneSync: status.oneSync,
    endpoint: status.endpoint,
  };
}
