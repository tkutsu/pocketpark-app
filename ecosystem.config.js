// pm2 config file
module.exports = {
  apps: [
    {
      name: "thesis-app",
      script: "./node_modules/next/dist/bin/next",
      args: "start",
      instances: "1",
      exec_mode: "cluster",
      exp_backoff_restart_delay: 100,
      time: true,
      env: { NODE_ENV: "production" },
    },
  ],
};
