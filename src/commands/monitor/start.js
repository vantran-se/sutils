const { execSync } = require('child_process');

const SERVICE_NAME = 'sutils-monitor';

function run() {
  try {
    execSync(`systemctl start ${SERVICE_NAME}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to start service: ${err.message}`);
    console.error(`Run "sutils monitor enable" first if the service is not installed.`);
    process.exit(1);
  }
}

module.exports = { run };
