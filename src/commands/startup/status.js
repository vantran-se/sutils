const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');
const { DEFAULT_CONFIG } = require('../../paths');
const { serviceNameFor } = require('./service');

function run(args) {
  const configIdx = args.indexOf('--config');
  const configPath = configIdx !== -1 && args[configIdx + 1]
    ? path.resolve(args[configIdx + 1])
    : DEFAULT_CONFIG;

  if (!fs.existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    process.exit(1);
  }

  const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

  if (!Array.isArray(config.scripts) || config.scripts.length === 0) {
    console.error('Config error: "scripts" must be a non-empty array.');
    process.exit(1);
  }

  for (const script of config.scripts) {
    const svcName = serviceNameFor(script.name);
    console.log(`\n── ${script.name} (${svcName})`);
    try {
      execSync(`systemctl status ${svcName}`, { stdio: 'inherit' });
    } catch (err) {
      if (err.status === 127) {
        console.error('systemctl not found — is this a systemd system?');
        process.exit(1);
      }
      // non-zero exit from systemctl status is normal (inactive/failed), output already printed
    }
  }
}

module.exports = { run };
