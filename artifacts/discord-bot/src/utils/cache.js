import { config } from '../config/config.js';
import logger from './logger.js';

class Cache {
  constructor() {
    this.store = new Map();
    this.timers = new Map();
  }

  set(key, value, ttl = config.cache.ttl) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    this.store.set(key, { value, createdAt: Date.now() });
    const timer = setTimeout(() => this.delete(key), ttl);
    this.timers.set(key, timer);
    return this;
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    return item.value;
  }

  has(key) {
    return this.store.has(key);
  }

  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.store.delete(key);
  }

  clear() {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.store.clear();
    logger.info('[Cache] Cache cleared');
  }

  size() {
    return this.store.size;
  }

  getStats() {
    return {
      size: this.store.size,
      keys: [...this.store.keys()],
    };
  }
}

export const serverCache = new Cache();
export const playerCache = new Cache();
export const generalCache = new Cache();

export default Cache;
