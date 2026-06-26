module.exports = {
  apps: [
    {
      name: 'fivem-player-finder-v5',
      script: 'src/index.js',
      node_args: '--experimental-vm-modules',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './src/logs/pm2-error.log',
      out_file: './src/logs/pm2-out.log',
    },
  ],
};
