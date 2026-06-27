import { fetchServerInfo, fetchPlayers } from './fivemApi.js';
import { serverCache, playerCache } from '../../utils/cache.js';
import { config } from '../../config/config.js';
import logger from '../../utils/logger.js';
import { getDb } from '../../database/db.js';

function resolveFromDb(input) {
  try {
    const db = getDb();
    const lower = input.toLowerCase().trim();
    let row = db.prepare(`SELECT * FROM servers WHERE cfx_code = ? AND is_active = 1`).get(input);
    if (row) return row;
    const servers = db.prepare(`SELECT * FROM servers WHERE is_active = 1`).all();
    for (const s of servers) {
      if (!s.alias) continue;
      if (s.alias.split(',').map(a => a.trim().toLowerCase()).includes(lower)) return s;
    }
    row = db.prepare(`SELECT * FROM servers WHERE is_active = 1 AND LOWER(name) LIKE ? LIMIT 1`).get(`%${lower}%`);
    return row || null;
  } catch { return null; }
}

function asDirectEndpoint(input) {
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(input)) return input;
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}:\d+$/.test(input)) return input;
  if (/\.cfx\.re/.test(input)) return input.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return null;
}

export async function getServerEndpoint(input) {
  const cacheKey = `server:${input}`;
  if (serverCache.has(cacheKey)) return serverCache.get(cacheKey);

  const dbRow = resolveFromDb(input);

  // Use real CFX code if available (allows FiveM API to work for player data)
  const cfxReal = dbRow?.cfx_real?.trim();
  if (cfxReal) {
    try {
      const serverData = await fetchServerInfo(cfxReal);
      if (serverData?.Data) {
        const endpoint = serverData.Data.connectEndPoints?.[0] || dbRow.endpoint;
        const result = { serverData, endpoint, dbRow };
        serverCache.set(cacheKey, result, config.cache.serverTtl);
        return result;
      }
    } catch (err) {
      logger.warn(`[PlayerService] CFX API failed for ${cfxReal}: ${err.message}`);
    }
  }

  const endpoint = dbRow?.endpoint || asDirectEndpoint(input);
  if (endpoint) {
    // Try FiveM API with endpoint as key
    try {
      const serverData = await fetchServerInfo(endpoint);
      if (serverData?.Data) {
        const result = { serverData, endpoint, dbRow };
        serverCache.set(cacheKey, result, config.cache.serverTtl);
        return result;
      }
    } catch {}

    // Return basic stub — direct /players.json will be tried later
    const result = {
      serverData: { Data: { hostname: dbRow?.name || endpoint, connectEndPoints: [endpoint], clients: null, sv_maxclients: 64 } },
      endpoint,
      dbRow,
    };
    serverCache.set(cacheKey, result, config.cache.serverTtl);
    return result;
  }

  // Standard FiveM API path (user typed a cfx code directly)
  const serverData = await fetchServerInfo(input);
  const ep = serverData?.Data?.connectEndPoints?.[0];
  if (!ep) throw new Error('Endpoint server tidak ditemukan di FiveM API');
  const result = { serverData, endpoint: ep, dbRow: null };
  serverCache.set(cacheKey, result, config.cache.serverTtl);
  return result;
}

export async function getAllPlayers(input) {
  const cacheKey = `players:${input}`;
  if (playerCache.has(cacheKey)) return playerCache.get(cacheKey);

  const { serverData, endpoint, dbRow } = await getServerEndpoint(input);

  // Prefer FiveM API player list (no port 30120 needed)
  let players = serverData?.Data?.players;
  if (!Array.isArray(players) || players.length === 0) {
    try {
      players = await fetchPlayers(endpoint);
    } catch (err) {
      logger.warn(`[PlayerService] Direct fetch failed for ${endpoint}: ${err.message}`);
      players = [];
    }
  }

  const result = { players, serverData, endpoint, dbRow };
  playerCache.set(cacheKey, result, config.cache.ttl);
  return result;
}

export async function findPlayerByName(input, name) {
  const { players, serverData, endpoint, dbRow } = await getAllPlayers(input);
  const found = players.filter(p => p.name?.toLowerCase().includes(name.toLowerCase()));
  return { found, serverData, endpoint, dbRow };
}

export async function findPlayerById(input, playerId) {
  const { players, serverData, endpoint, dbRow } = await getAllPlayers(input);
  const id = parseInt(playerId, 10);
  const found = players.find(p => p.id === id);
  return { found: found ? [found] : [], serverData, endpoint, dbRow };
}

export function getPlayerIdentifiers(player) {
  const ids = player.identifiers || [];
  return {
    discord: ids.find(i => i.startsWith('discord:'))?.split(':')[1] || null,
    steam: ids.find(i => i.startsWith('steam:')) || null,
    license: ids.find(i => i.startsWith('license:')) || null,
    ip: ids.find(i => i.startsWith('ip:'))?.split(':')[1] || null,
    xbl: ids.find(i => i.startsWith('xbl:')) || null,
    live: ids.find(i => i.startsWith('live:')) || null,
    fivem: ids.find(i => i.startsWith('fivem:')) || null,
  };
}

export async function autocompleteServer(query, db) {
  try {
    const lower = `%${query.toLowerCase()}%`;
    return db.prepare(`
      SELECT cfx_code, name, alias, endpoint, banner_url FROM servers
      WHERE is_active = 1 AND (LOWER(cfx_code) LIKE ? OR LOWER(name) LIKE ? OR LOWER(alias) LIKE ?)
      LIMIT 25
    `).all(lower, lower, lower);
  } catch { return []; }
}
