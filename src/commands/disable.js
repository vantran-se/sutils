const requireRoot = require('../lib/requireRoot');
const { listEnabledServices, applyToServices } = require('../lib/listServices');

function run() {
  requireRoot();

  const services = listEnabledServices();
  if (services.length === 0) {
    console.log('No enabled sutils services found.');
    process.exit(0);
  }

  applyToServices(services, ['disable', '--now'], 'Disabling', 'disabled');
}

module.exports = { run };
