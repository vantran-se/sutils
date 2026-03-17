const { execFileSync } = require('child_process');
const { listEnabledServices } = require('../lib/listServices');

function run() {
  const { name } = require('../../package.json');

  // npm must run as the current user (nvm/user-local installs won't work as root)
  console.log(`Updating ${name}...`);
  execFileSync('npm', ['install', '-g', `${name}@latest`], { stdio: 'inherit' });

  const services = listEnabledServices();
  if (services.length === 0) {
    console.log('\nNo enabled sutils services to restart.');
    return;
  }

  // systemctl requires root — escalate only for this step
  console.log('\nRestarting services...');
  execFileSync(
    'sudo', ['-E', process.execPath, process.argv[1], 'restart'],
    { stdio: 'inherit' }
  );
}

module.exports = { run };
