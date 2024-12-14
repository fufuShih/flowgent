module.exports = {
  apps: [
    {
      name: 'flowgent',
      script: './dist/backend/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
    },
  ],
};
