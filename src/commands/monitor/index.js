const path = require('path');

function getConfigPath(args) {
  const idx = args.indexOf('--config');
  if (idx !== -1 && args[idx + 1]) {
    return path.resolve(args[idx + 1]);
  }
  return path.join(process.cwd(), 'config.yaml');
}

function printHelp() {
  console.log(`
sutils monitor — auto-shutdown server when all monitored ports are idle

Usage:
  sutils monitor <subcommand> [options]

Subcommands:
  init     Create a starter config.yaml in the current directory
  start    Start monitoring

Options:
  --config <path>   Path to config file (default: ./config.yaml)
  --dry-run         Log what would happen without executing shutdown

Examples:
  sutils monitor init
  sutils monitor start
  sutils monitor start --config /etc/sutils/config.yaml
  sutils monitor start --dry-run
`);
}

module.exports = function monitor(args) {
  const subcommand = args[0];

  switch (subcommand) {
    case 'init':
      require('./init').run();
      break;

    case 'start':
      require('./start').start({
        configPath: getConfigPath(args),
        dryRun: args.includes('--dry-run'),
      });
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
