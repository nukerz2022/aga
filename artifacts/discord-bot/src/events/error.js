import logger from '../utils/logger.js';

export default {
  name: 'error',
  once: false,
  async execute(error) {
    logger.error(`[Discord Error] ${error.message}`, { stack: error.stack });
  },
};
