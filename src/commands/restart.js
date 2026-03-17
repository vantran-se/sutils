const { execFileSync } = require('child_process');
const requireRoot = require('../lib/requireRoot');
const { listEnabledServices, applyToServices } = require('../lib/listServices');

function run() {
  requireRoot();

  execFileSync('systemctl', ['daemon-reload'], { stdio: 'inherit' });

  const services = listEnabledServices();
  if (services.length === 0) {
    console.log('No enabled sutils services found.');
    process.exit(0);
  }

  applyToServices(services, ['restart'], 'Restarting', 'restarted');
}

module.exports = { run };
