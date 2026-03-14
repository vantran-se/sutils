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
    execSync(`systemctl enable --now ${SERVICE_NAME}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to start service: ${err.message}`);
    console.error(`Run "sutils monitor enable" first if the service is not installed.`);
    process.exit(1);
  }
}

module.exports = { run };
