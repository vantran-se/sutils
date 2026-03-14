const { execSync } = require('child_process');

const SERVICE_NAME = 'sutils-monitor';

function run() {
  try {
    execSync(`systemctl status ${SERVICE_NAME}`, { stdio: 'inherit' });
  } catch (err) {
    // systemctl status exits with non-zero when service is inactive — that's fine
    if (err.status === 127) {
      console.error('systemctl not found. Is this a systemd-based system?');
      process.exit(1);
    }
  }
}

module.exports = { run };
