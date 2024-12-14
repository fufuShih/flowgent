module.exports = {
  apps: [
    {
      name: 'flowgent-backend',
      script: 'packages/backend/dist/index.js',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
