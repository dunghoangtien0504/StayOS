// PM2 Ecosystem Config - StayOS Production
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'stayos',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/home/apps/StayOS',

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Process config
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',

      // Logs
      error_file: '/var/log/pm2/stayos-error.log',
      out_file: '/var/log/pm2/stayos-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
    },
  ],
};
