const { execSync } = require('child_process');
const requireRoot = require('../../lib/requireRoot');

const SERVICE_NAME = 'sutils-monitor';

function run() {
  requireRoot();
  try {
    execSync(`systemctl stop ${SERVICE_NAME}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to stop service: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { run };
