import http from 'http';
import logger from '../utils/logger.js';

export function startKeepaliveServer(client) {
  const port = parseInt(process.env.PORT || '3000', 10);

  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/' || req.url === '/bot/health' || req.url === '/bot') {
      const status = client?.isReady() ? 'online' : 'starting';
      const guilds = client?.guilds?.cache?.size ?? 0;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status,
        bot: 'STRONAUT',
        version: '5.0.0',
        guilds,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(port, '0.0.0.0', () => {
    logger.info(`[Keepalive] HTTP server listening on port ${port} — ping /health for UptimeRobot`);
  });

  server.on('error', (err) => {
    logger.error(`[Keepalive] HTTP server error: ${err.message}`);
  });

  return server;
}
