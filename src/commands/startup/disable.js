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
    if (!script.name || !script.run) {
      console.error('Config error: each script must have "name" and "run" fields.');
      process.exit(1);
    }
  }

  for (const script of config.scripts) {
    const svcName = serviceNameFor(script.name);
    const svcPath = `/etc/systemd/system/${svcName}.service`;

    try {
      execFileSync('systemctl', ['disable', svcName], { stdio: 'inherit' });
    } catch {
      // already disabled — ignore
    }

    if (fs.existsSync(svcPath)) {
      fs.unlinkSync(svcPath);
      console.log(`Removed ${svcPath}`);
    }
  }

  execFileSync('systemctl', ['daemon-reload'], { stdio: 'inherit' });
  console.log(`\nDisabled ${config.scripts.length} startup script(s).`);
}

module.exports = { run };
