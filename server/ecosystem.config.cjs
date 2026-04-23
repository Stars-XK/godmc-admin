module.exports = {
  apps: [
    {
      name: 'api_gateway',
      script: 'dist/apps/api-gateway/main.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'micro_auth',
      script: 'dist/apps/micro-auth/main.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'micro_system',
      script: 'dist/apps/micro-system/main.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'micro_monitor',
      script: 'dist/apps/micro-monitor/main.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'micro_upload',
      script: 'dist/apps/micro-upload/main.js',
      env: { NODE_ENV: 'production' },
    },{
      name: 'micro_tools',
      script: 'dist/apps/micro-tools/main.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'micro_water_basic',
      script: 'dist/apps/micro-water-basic/main.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'micro_data_integration',
      script: 'dist/apps/micro-data-integration/main.js',
      env: {
        NODE_ENV: 'production',
      },
    }],
};
