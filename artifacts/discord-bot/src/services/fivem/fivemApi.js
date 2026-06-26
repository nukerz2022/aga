import axios from 'axios';
import { config } from '../../config/config.js';
import logger from '../../utils/logger.js';

const client = axios.create({
  timeout: config.fivem.timeout,
  headers: { 'User-Agent': 'FiveM-Player-Finder/5.0' },
});

async function withRetry(fn, retries = config.fivem.retries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      logger.warn(`[FiveM API] Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }
}

/** Build base URL for a given endpoint (IP:port, domain:port, or private CFX URL) */
export function buildBaseUrl(endpoint) {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint.replace(/\/$/, '');
  }
  // Private CFX server (e.g. xxx.cfx.re) — use HTTPS
  if (endpoint.includes('.cfx.re')) {
    return `https://${endpoint}`;
  }
  return `http://${endpoint}`;
}

export async function fetchServerInfo(cfxCode) {
  return withRetry(async () => {
    const url = `${config.fivem.apiBase}/${cfxCode}`;
    const res = await client.get(url);
    return res.data;
  });
}

export async function fetchPlayers(endpoint) {
  return withRetry(async () => {
    const base = buildBaseUrl(endpoint);
    const res = await client.get(`${base}/players.json`);
    return Array.isArray(res.data) ? res.data : [];
  });
}

export async function fetchServerDetails(endpoint) {
  return withRetry(async () => {
    const base = buildBaseUrl(endpoint);
    const res = await client.get(`${base}/info.json`);
    return res.data;
  });
}

export async function fetchDynamicInfo(endpoint) {
  return withRetry(async () => {
    const base = buildBaseUrl(endpoint);
    const res = await client.get(`${base}/dynamic.json`);
    return res.data;
  });
}

export default { fetchServerInfo, fetchPlayers, fetchServerDetails, fetchDynamicInfo };
