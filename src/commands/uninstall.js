const fs = require('fs');
const { execFileSync } = require('child_process');
const requireRoot = require('../lib/requireRoot');
const { listEnabledServices } = require('../lib/listServices');

const SERVICE_DIR = '/etc/systemd/system';

function run() {
  requireRoot();

  const { name } = require('../../package.json');

  // 1. Stop + disable all services
  const services = listEnabledServices();
  for (const svc of services) {
    console.log(`Stopping and disabling ${svc}...`);
    try {
      execFileSync('systemctl', ['disable', '--now', svc], { stdio: 'inherit' });
    } catch {
      // already stopped/disabled — continue
    }
  }

  // 2. Remove service files
  let dirEntries = [];
  try {
    dirEntries = fs.readdirSync(SERVICE_DIR);
  } catch {
    // directory missing or unreadable — nothing to clean up
  }
  const files = dirEntries.filter(f => f.startsWith('sutils-') && f.endsWith('.service'));
  for (const file of files) {
    const filePath = `${SERVICE_DIR}/${file}`;
    fs.unlinkSync(filePath);
    console.log(`Removed ${filePath}`);
  }

  if (services.length > 0 || files.length > 0) {
    execFileSync('systemctl', ['daemon-reload'], { stdio: 'inherit' });
  }

  // 3. Uninstall npm package
  console.log(`\nUninstalling ${name}...`);
  execFileSync('npm', ['uninstall', '-g', name], { stdio: 'inherit' });

  console.log('\nDone. Config files at ~/.sutils/ were left intact.');
}

module.exports = { run };
