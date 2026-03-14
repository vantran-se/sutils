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
