const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { DEFAULT_CONFIG } = require('../../paths');
const requireRoot = require('../../lib/requireRoot');

const SERVICE_NAME = 'sutils-monitor';
const SERVICE_PATH = `/etc/systemd/system/${SERVICE_NAME}.service`;
const SLEEP_HOOK_PATH = `/lib/systemd/system-sleep/sutils-monitor`;

function run(args) {
  requireRoot(args);

  const configIdx = args.indexOf('--config');
  const configPath = configIdx !== -1 && args[configIdx + 1]
    ? path.resolve(args[configIdx + 1])
    : DEFAULT_CONFIG;

  // Use the currently running node binary and sutils script for ExecStart
  // so the service always uses the same installation.
  const nodePath = process.execPath;
  const sutilsPath = path.resolve(process.argv[1]);
  const execStart = `${nodePath} ${sutilsPath} monitor run --config ${configPath}`;

  const serviceFile = `[Unit]
Description=sutils monitor
After=network.target

[Service]
ExecStart=${execStart}
Restart=always
RestartSec=10
RestartForceExitStatus=0

[Install]
WantedBy=multi-user.target
`;

  try {
    fs.writeFileSync(SERVICE_PATH, serviceFile);
  } catch (err) {
    console.error(`Failed to write service file to ${SERVICE_PATH}: ${err.message}`);
    console.error('Try running with sudo.');
    process.exit(1);
  }

  console.log(`Wrote ${SERVICE_PATH}`);

  // Install sleep hook for suspend/resume handling
  const sleepHookSrc = fs.readFileSync(path.join(__dirname, 'sleep-hook.js'), 'utf8');
  fs.writeFileSync(SLEEP_HOOK_PATH, sleepHookSrc, { mode: 0o755 });
  console.log(`Wrote ${SLEEP_HOOK_PATH}`);

  try {
    execFileSync('systemctl', ['daemon-reload'], { stdio: 'inherit' });
    execFileSync('systemctl', ['enable', SERVICE_NAME], { stdio: 'inherit' });
  } catch (err) {
    console.error(`systemctl failed: ${err.message}`);
    process.exit(1);
  }

  console.log(`\nEnabled. Run "sutils monitor start" to start it now.`);
  console.log(`Config: ${configPath}`);
  console.log(`\nSleep hook installed - monitor will auto-restart after system suspend/resume.`);
}

module.exports = { run };

