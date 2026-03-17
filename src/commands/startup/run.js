const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const yaml = require('js-yaml');
const { DEFAULT_CONFIG } = require('../../paths');
const { serviceNameFor } = require('./service');
const requireRoot = require('../../lib/requireRoot');

function run(args) {
  requireRoot();

  const configIdx = args.indexOf('--config');
  const configPath = configIdx !== -1 && args[configIdx + 1]
    ? path.resolve(args[configIdx + 1])
    : DEFAULT_CONFIG;

  if (!fs.existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    console.error('Run "sutils startup init" to create ~/.sutils/config.yaml');
    process.exit(1);
  }

  const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

  if (!Array.isArray(config.scripts) || config.scripts.length === 0) {
    console.error('Config error: "scripts" must be a non-empty array.');
    process.exit(1);
  }

  for (const script of config.scripts) {
    const svcName = serviceNameFor(script.name);
    console.log(`\nStarting: ${script.name} (${svcName})`);
    try {
      execFileSync('systemctl', ['start', svcName], { stdio: 'inherit' });
    } catch (err) {
      console.error(`Failed to start ${svcName}: ${err.message}`);
      console.error('Make sure the service is enabled first with: sutils startup enable');
    }
  }
}

module.exports = { run };
