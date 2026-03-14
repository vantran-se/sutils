const { execSync, execFileSync } = require('child_process');

const SERVICE_NAME = 'sutils-monitor';

function requireRoot() {
  if (process.getuid && process.getuid() !== 0) {
    console.log('[sutils] Requires root — re-running with sudo...');
    execFileSync('sudo', ['-E', process.execPath, process.argv[1], ...process.argv.slice(2)], { stdio: 'inherit' });
    process.exit(0);
  }
}

function run() {
  requireRoot();
  try {
    execSync(`systemctl stop ${SERVICE_NAME}`, { stdio: 'inherit' });
  } catch {
    // service may already be stopped — not fatal
  }

  try {
    execSync(`systemctl disable ${SERVICE_NAME}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to disable service: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { run };
