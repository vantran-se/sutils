const path = require('path');
const { DEFAULT_CONFIG } = require('../../paths');

function getConfigPath(args) {
  const idx = args.indexOf('--config');
  if (idx !== -1 && args[idx + 1]) {
    return path.resolve(args[idx + 1]);
  }
  return DEFAULT_CONFIG;
}

function printHelp() {
  console.log(`
sutils monitor — auto-shutdown server when all monitored ports are idle

Usage:
  sutils monitor <subcommand> [options]

Subcommands:
  init      Create a starter config.yaml in ~/.sutils/
  run       Run the monitor process directly (foreground)

  enable    Install and enable the systemd service
  disable   Stop and disable the systemd service
  start     Start the systemd service
  stop      Stop the systemd service
  status    Show systemd service status

Options:
  --config <path>   Path to config file (default: ~/.sutils/config.yaml)
  --dry-run         Log what would happen without executing shutdown (run only)

Examples:
  sutils monitor init
  sutils monitor enable
  sutils monitor start
  sutils monitor status
  sutils monitor stop
  sutils monitor disable
  sutils monitor run --dry-run
`);
}

module.exports = function monitor(args) {
  const subcommand = args[0];

  switch (subcommand) {
    case 'init':
      require('./init').run();
      break;

    case 'run':
      require('./run').run({
        configPath: getConfigPath(args),
        dryRun: args.includes('--dry-run'),
      });
      break;

    case 'enable':
      require('./enable').run(args.slice(1));
      break;

    case 'disable':
      require('./disable').run();
      break;

    case 'start':
      require('./start').run();
      break;

    case 'stop':
      require('./stop').run();
      break;

    case 'status':
      require('./status').run();
      break;

    case '--help':
    case '-h':
    case 'help':
      printHelp();
      break;

    default:
      printHelp();
      process.exit(subcommand ? 1 : 0);
  }
};
