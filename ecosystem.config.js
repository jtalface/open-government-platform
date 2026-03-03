const path = require('path');

module.exports = {
  apps: [
    {
      name: 'ogp-web',
      script: 'pnpm',
      args: 'start',
      // Always run the web app with CWD at apps/web so Next and the
      // upload route agree on the public/ directory location.
      cwd: path.join(__dirname, 'apps', 'web'),
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      instances: 1,
      exec_mode: 'fork',
      error_file: './logs/ogp-error.log',
      out_file: './logs/ogp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
    },
  ],
};
