function printHelp() {
  console.log(`
sutils startup — register scripts to run automatically at server boot

Usage:
  sutils startup <subcommand> [options]

Subcommands:
  init      Create ~/.sutils/config.yaml from the example (if not yet created)
  enable    Register scripts as systemd services (run at boot)
  disable   Remove scripts from systemd
  run       Run all startup scripts now (via systemctl start)
  status    Show status of each startup script service

Options:
  --config <path>   Path to config file (default: ~/.sutils/config.yaml)

Examples:
  sutils startup init
  sutils startup enable
  sutils startup run
  sutils startup status
  sutils startup disable
`);
}

module.exports = function startup(args) {
  const subcommand = args[0];

  switch (subcommand) {
    case 'init':
      require('./init').run();
      break;

    case 'enable':
      require('./enable').run(args.slice(1));
      break;

    case 'disable':
      require('./disable').run(args.slice(1));
      break;

    case 'run':
      require('./run').run(args.slice(1));
      break;

    case 'status':
      require('./status').run(args.slice(1));
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
