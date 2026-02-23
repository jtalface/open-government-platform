module.exports = {
  apps: [
    {
      name: 'ogp-web',
      script: 'pnpm',
      args: 'start',
      cwd: process.cwd(),
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
