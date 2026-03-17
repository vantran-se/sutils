const { execFileSync } = require('child_process');

function requireRoot() {
  if (process.getuid && process.getuid() !== 0) {
    console.log('[sutils] Requires root — re-running with sudo...');
    execFileSync('sudo', ['-E', process.execPath, process.argv[1], ...process.argv.slice(2)], { stdio: 'inherit' });
    process.exit(0);
  }
}

module.exports = requireRoot;
