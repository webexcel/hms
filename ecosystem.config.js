module.exports = {
  apps: [
    {
      name: 'hotel-api',
      script: 'server/src/server.js',
      cwd: '/var/www/hms',
      env: {
        NODE_ENV: 'production',
        PORT: 3006,
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
    },
  ],
};
