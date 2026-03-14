const fs = require('fs');
const yaml = require('js-yaml');
const { checkPorts } = require('./monitor');
const { executeShutdown } = require('./shutdown');

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    console.error('Run "sutils monitor init" to create a starter config.yaml');
    process.exit(1);
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const config = yaml.load(raw);

  if (!Array.isArray(config.ports) || config.ports.length === 0) {
    console.error('Config error: "ports" must be a non-empty array.');
    process.exit(1);
  }
  if (typeof config.check_interval !== 'number' || config.check_interval <= 0) {
    console.error('Config error: "check_interval" must be a positive number (seconds).');
    process.exit(1);
  }
  if (typeof config.grace_period !== 'number' || config.grace_period <= 0) {
    console.error('Config error: "grace_period" must be a positive number (seconds).');
    process.exit(1);
  }
  if (typeof config.shutdown_command !== 'string' || !config.shutdown_command.trim()) {
    console.error('Config error: "shutdown_command" must be a non-empty string.');
    process.exit(1);
  }

  return config;
}

function log(message) {
  console.log(`[${new Date().toISOString()}] [sutils:monitor] ${message}`);
}

function run({ configPath, dryRun }) {
  const config = loadConfig(configPath);

  const { ports, check_interval, grace_period, shutdown_command } = config;
  const checkIntervalMs = check_interval * 1000;
  const gracePeriodMs = grace_period * 1000;

  log(`Starting monitor (config: ${configPath})`);
  log(`Monitoring ports: ${ports.join(', ')}`);
  log(`Check interval: ${check_interval}s | Grace period: ${grace_period}s`);
  if (dryRun) log('DRY RUN mode – shutdown will be logged but not executed');

  let idleSince = null;

  function check() {
    let result;

    try {
      result = checkPorts(ports);
    } catch (err) {
      log(`ERROR checking connections: ${err.message}`);
      return;
    }

    if (result.hasActiveConnections) {
      if (idleSince !== null) {
        log(`Connection detected on port(s): ${result.activeMonitored.join(', ')} — resetting idle timer`);
      } else {
        log(`Active connections on port(s): ${result.activeMonitored.join(', ')}`);
      }
      idleSince = null;
    } else {
      const now = Date.now();

      if (idleSince === null) {
        idleSince = now;
        log(`No active connections on any monitored port — starting grace period (${grace_period}s)`);
      }

      const idleSec = Math.floor((now - idleSince) / 1000);
      log(`Idle for ${idleSec}s / ${grace_period}s`);

      if (now - idleSince >= gracePeriodMs) {
        executeShutdown(shutdown_command, dryRun);
        if (!dryRun) process.exit(0);
        idleSince = null;
      }
    }
  }

  check();
  setInterval(check, checkIntervalMs);
}

module.exports = { run };
