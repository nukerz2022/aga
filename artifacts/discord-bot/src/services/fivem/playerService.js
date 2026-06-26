import { fetchServerInfo, fetchPlayers } from './fivemApi.js';
import { serverCache, playerCache } from '../../utils/cache.js';
import { config } from '../../config/config.js';
import logger from '../../utils/logger.js';
import { getDb } from '../../database/db.js';

/**
 * Resolve an alias or cfx_code to a DB row.
 */
function resolveFromDb(input) {
  try {
    const db = getDb();
    const lower = input.toLowerCase().trim();

    // Exact cfx_code match
    let row = db.prepare(`SELECT * FROM servers WHERE cfx_code = ? AND is_active = 1`).get(input);
    if (row) return row;

    // Alias match
    const servers = db.prepare(`SELECT * FROM servers WHERE is_active = 1`).all();
    for (const s of servers) {
      if (!s.alias) continue;
      const aliases = s.alias.split(',').map(a => a.trim().toLowerCase());
      if (aliases.includes(lower)) return s;
    }

    // Partial name match
    row = db.prepare(
      `SELECT * FROM servers WHERE is_active = 1 AND LOWER(name) LIKE ? LIMIT 1`
    ).get(`%${lower}%`);
    return row || null;
  } catch {
    return null;
  }
}

/**
 * Check if input looks like a direct endpoint (IP:port or domain:port or CFX private URL).
 */
function asDirectEndpoint(input) {
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(input)) return input;
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}:\d+$/.test(input)) return input;
  if (/\.cfx\.re/.test(input)) return input.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return null;
}

/**
 * Resolve input → { serverData, endpoint, name }
 * Priority: DB alias → FiveM API (via endpoint as code) → direct endpoint → FiveM API (standard cfxCode)
 */
export async function getServerEndpoint(input) {
  const cacheKey = `server:${input}`;
  if (serverCache.has(cacheKey)) return serverCache.get(cacheKey);

  // 1. Resolve from DB
  const dbRow = resolveFromDb(input);
  const endpoint = dbRow?.endpoint || asDirectEndpoint(input);

  if (endpoint) {
    // Try FiveM master server API with endpoint as identifier (HTTPS — works on Replit)
    try {
      const serverData = await fetchServerInfo(endpoint);
      if (serverData?.Data) {
        const result = { serverData, endpoint, name: dbRow?.name };
        serverCache.set(cacheKey, result, config.cache.serverTtl);
        return result;
      }
    } catch (err) {
      logger.warn(`[PlayerService] FiveM API failed for ${endpoint}: ${err.message}`);
    }

    // FiveM API didn't have it — return basic info (direct connection will be attempted for players)
    const result = {
      serverData: {
        Data: {
          hostname: dbRow?.name || endpoint,
          connectEndPoints: [endpoint],
          clients: 0,
          sv_maxclients: 64,
        },
      },
      endpoint,
      name: dbRow?.name,
    };
    serverCache.set(cacheKey, result, config.cache.serverTtl);
    return result;
  }

  // 2. Standard FiveM API with cfxCode
  const serverData = await fetchServerInfo(input);
  const ep = serverData?.Data?.connectEndPoints?.[0];
  if (!ep) throw new Error('Endpoint server tidak ditemukan di FiveM API');

  const result = { serverData, endpoint: ep };
  serverCache.set(cacheKey, result, config.cache.serverTtl);
  return result;
}

/**
 * Get all players for a server.
 * First tries to use Data.players from FiveM API (no port 30120 needed).
 * Falls back to direct /players.json if API data is unavailable.
 */
export async function getAllPlayers(input) {
  const cacheKey = `players:${input}`;
  if (playerCache.has(cacheKey)) return playerCache.get(cacheKey);

  const { serverData, endpoint, name } = await getServerEndpoint(input);

  // Prefer player list from FiveM master server API (avoids direct port connection)
  let players = serverData?.Data?.players;

  if (!Array.isArray(players) || players.length === 0) {
    // Fallback: try direct HTTP to game server
    try {
      players = await fetchPlayers(endpoint);
    } catch (err) {
      logger.warn(`[PlayerService] Direct fetch failed for ${endpoint}: ${err.message}`);
      players = [];
    }
  }

  const result = { players, serverData, endpoint, name };
  playerCache.set(cacheKey, result, config.cache.ttl);
  return result;
}

export async function findPlayerByName(input, name) {
  const { players, serverData, endpoint } = await getAllPlayers(input);
  const found = players.filter(p =>
    p.name?.toLowerCase().includes(name.toLowerCase())
  );
  return { found, serverData, endpoint };
}

export async function findPlayerById(input, playerId) {
  const { players, serverData, endpoint } = await getAllPlayers(input);
  const id = parseInt(playerId, 10);
  const found = players.find(p => p.id === id);
  return { found: found ? [found] : [], serverData, endpoint };
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
    const servers = db.prepare(
      `SELECT cfx_code, name, alias, endpoint FROM servers
       WHERE is_active = 1
         AND (LOWER(cfx_code) LIKE ? OR LOWER(name) LIKE ? OR LOWER(alias) LIKE ?)
       LIMIT 25`
    ).all(lower, lower, lower);
    return servers;
  } catch {
    return [];
  }
}
