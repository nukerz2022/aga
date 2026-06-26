import { fetchServerInfo, fetchPlayers } from './fivemApi.js';
import { serverCache, playerCache } from '../../utils/cache.js';
import { config } from '../../config/config.js';
import logger from '../../utils/logger.js';
import { getDb } from '../../database/db.js';

/**
 * Resolve an alias or cfx_code to an { endpoint, name } from the DB.
 * Returns null if not found.
 */
function resolveFromDb(input) {
  try {
    const db = getDb();
    const lower = input.toLowerCase().trim();

    // Try exact cfx_code match first
    let row = db.prepare(`SELECT * FROM servers WHERE cfx_code = ? AND is_active = 1`).get(input);
    if (row) return row;

    // Try alias match
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
 * Determine if input is a direct endpoint (IP:port or domain:port or CFX private URL).
 * If so, return the endpoint string. Otherwise null.
 */
function asDirectEndpoint(input) {
  // IP:port
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(input)) return input;
  // domain:port
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}:\d+$/.test(input)) return input;
  // private CFX URL
  if (/\.cfx\.re/.test(input)) return input.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return null;
}

export async function getServerEndpoint(input) {
  const cacheKey = `server:${input}`;
  if (serverCache.has(cacheKey)) return serverCache.get(cacheKey);

  // 1. Resolve from DB (alias / cfx_code)
  const dbRow = resolveFromDb(input);
  if (dbRow?.endpoint) {
    const endpoint = dbRow.endpoint;
    const result = {
      serverData: {
        Data: {
          hostname: dbRow.name || endpoint,
          connectEndPoints: [endpoint],
        },
      },
      endpoint,
      name: dbRow.name,
    };
    serverCache.set(cacheKey, result, config.cache.serverTtl);
    return result;
  }

  // 2. Direct endpoint (IP:port or domain:port)
  const directEndpoint = asDirectEndpoint(input);
  if (directEndpoint) {
    const result = {
      serverData: {
        Data: {
          hostname: directEndpoint,
          connectEndPoints: [directEndpoint],
        },
      },
      endpoint: directEndpoint,
    };
    serverCache.set(cacheKey, result, config.cache.serverTtl);
    return result;
  }

  // 3. Fall back to FiveM API
  const serverData = await fetchServerInfo(input);
  const endpoint = serverData?.Data?.connectEndPoints?.[0];
  if (!endpoint) throw new Error('Endpoint server tidak ditemukan');

  const result = { serverData, endpoint };
  serverCache.set(cacheKey, result, config.cache.serverTtl);
  return result;
}

export async function getAllPlayers(input) {
  const cacheKey = `players:${input}`;
  if (playerCache.has(cacheKey)) return playerCache.get(cacheKey);

  const { serverData, endpoint } = await getServerEndpoint(input);
  const players = await fetchPlayers(endpoint);

  const result = { players, serverData, endpoint };
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
