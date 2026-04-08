module.exports = {
  apps: [
    {
      name: 'hotel-api',
      script: 'server/src/server.js',
      cwd: '/var/www/hotel',
      env_file: '/var/www/hotel/server/.env.production',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/hotel/api-error.log',
      out_file: '/var/log/hotel/api-out.log',
      merge_logs: true,
    },
  ],
};
