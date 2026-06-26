import { fetchServerInfo, fetchPlayers } from './fivemApi.js';
import { serverCache, playerCache } from '../../utils/cache.js';
import { config } from '../../config/config.js';
import logger from '../../utils/logger.js';

export async function getServerEndpoint(cfxCode) {
  const cacheKey = `server:${cfxCode}`;
  if (serverCache.has(cacheKey)) return serverCache.get(cacheKey);

  const serverData = await fetchServerInfo(cfxCode);
  const endpoint = serverData?.Data?.connectEndPoints?.[0];
  if (!endpoint) throw new Error('Endpoint server tidak ditemukan');

  serverCache.set(cacheKey, { serverData, endpoint }, config.cache.serverTtl);
  return { serverData, endpoint };
}

export async function getAllPlayers(cfxCode) {
  const cacheKey = `players:${cfxCode}`;
  if (playerCache.has(cacheKey)) return playerCache.get(cacheKey);

  const { serverData, endpoint } = await getServerEndpoint(cfxCode);
  const players = await fetchPlayers(endpoint);

  const result = { players, serverData, endpoint };
  playerCache.set(cacheKey, result, config.cache.ttl);
  return result;
}

export async function findPlayerByName(cfxCode, name) {
  const { players, serverData, endpoint } = await getAllPlayers(cfxCode);
  const found = players.filter(p =>
    p.name?.toLowerCase().includes(name.toLowerCase())
  );
  return { found, serverData, endpoint };
}

export async function findPlayerById(cfxCode, playerId) {
  const { players, serverData, endpoint } = await getAllPlayers(cfxCode);
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
    const servers = db.prepare(
      `SELECT cfx_code, name FROM servers WHERE is_active = 1 AND (cfx_code LIKE ? OR name LIKE ?) LIMIT 25`
    ).all(`%${query}%`, `%${query}%`);
    return servers;
  } catch {
    return [];
  }
}
