const fs = require('fs');
const { execSync } = require('child_process');
const requireRoot = require('../../lib/requireRoot');

const SERVICE_NAME = 'sutils-monitor';
const SLEEP_HOOK_PATH = `/lib/systemd/system-sleep/sutils-monitor`;

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

  // Remove sleep hook
  try {
    if (fs.existsSync(SLEEP_HOOK_PATH)) {
      fs.unlinkSync(SLEEP_HOOK_PATH);
      console.log(`Removed sleep hook: ${SLEEP_HOOK_PATH}`);
    }
  } catch (err) {
    console.error(`Warning: Could not remove sleep hook: ${err.message}`);
  }
}

module.exports = { run };
