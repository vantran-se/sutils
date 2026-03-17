#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  const { version } = require('../package.json');
  console.log(`
sutils v${version} — server utilities

Usage:
  sutils <command> [subcommand] [options]

Commands:
  monitor   Monitor port connections and auto-shutdown when idle
  startup   Register scripts to run automatically at server boot
  restart   Restart all enabled sutils services at once
  disable   Stop and disable all enabled sutils services
  update    Update sutils to latest and restart services
  uninstall Stop services, remove them, and uninstall sutils

Options:
  --version, -v   Print version number
  --help,    -h   Show this help

Run "sutils <command> --help" for command-specific options.
`);
}

switch (command) {
  case 'monitor':
    require('../src/commands/monitor')(args.slice(1));
    break;

  case 'startup':
    require('../src/commands/startup')(args.slice(1));
    break;

  case 'restart':
    require('../src/commands/restart').run();
    break;

  case 'disable':
    require('../src/commands/disable').run();
    break;

  case 'update':
    require('../src/commands/update').run();
    break;

  case 'uninstall':
    require('../src/commands/uninstall').run();
    break;

  case '--version':
  case '-v':
    console.log(require('../package.json').version);
    break;

  case '--help':
  case '-h':
  case 'help':
    printHelp();
    break;

  default:
    printHelp();
    process.exit(command ? 1 : 0);
}
