const { execFileSync } = require('child_process');
const requireRoot = require('../lib/requireRoot');
const { listEnabledServices, applyToServices } = require('../lib/listServices');

function run() {
  requireRoot();

  const { name } = require('../../package.json');

  console.log(`Updating ${name}...`);
  execFileSync('npm', ['install', '-g', `${name}@latest`], { stdio: 'inherit' });

  const services = listEnabledServices();
  if (services.length === 0) {
    console.log('\nNo enabled sutils services to restart.');
    return;
  }

  console.log('\nRestarting services...');
  applyToServices(services, ['restart'], 'Restarting', 'restarted');
}

module.exports = { run };
