const fs = require('fs');
const yaml = require('js-yaml');
const { checkPorts } = require('./monitor');
const { executeShutdown } = require('./shutdown');
const { buildNotifier } = require('./notify');

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
  if (typeof config.grace_checks !== 'number' || config.grace_checks <= 0 || !Number.isInteger(config.grace_checks)) {
    console.error('Config error: "grace_checks" must be a positive integer (number of idle checks before shutdown).');
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

  const { ports, check_interval, grace_checks, shutdown_command, skip_connectivity_ports = [] } = config;
  const checkIntervalMs = check_interval * 1000;

  const notify = buildNotifier(config.notify, log);

  log(`Starting monitor (config: ${configPath})`);
  log(`Monitoring ports: ${ports.join(', ')}`);
  log(`Check interval: ${check_interval}s | Grace checks: ${grace_checks}`);
  if (skip_connectivity_ports.length > 0) {
    log(`Skipping connectivity test and idle timeout for ports: ${skip_connectivity_ports.join(', ')}`);
  }
  if (dryRun) log('DRY RUN mode – shutdown will be logged but not executed');

  let idleCount = 0;
  let lastDeadCount = 0;

  async function check() {
    let result;

    try {
      result = await checkPorts(ports, { skipConnectivityPorts: skip_connectivity_ports });
    } catch (err) {
      log(`ERROR checking connections: ${err.message}`);
      notify('error', err.message);
      // Reset idle count on error to avoid accidental shutdown during network issues
      if (idleCount > 0) {
        log('Resetting idle counter due to connection check error');
        idleCount = 0;
      }
      return;
    }

    if (result.deadConnections > 0) {
      if (result.deadConnections !== lastDeadCount) {
        log(`Dead/dying connections detected: ${result.deadConnections}`);
        if (result.unreachablePorts.length > 0) {
          log(`Unreachable ports (failed connectivity test): ${result.unreachablePorts.join(', ')}`);
        }
        lastDeadCount = result.deadConnections;
      }
    }

    if (result.hasActiveConnections) {
      if (idleCount > 0) {
        log(`Connection detected on port(s): ${result.activeMonitored.join(', ')} — resetting idle counter`);
      } else {
        log(`Active connections on port(s): ${result.activeMonitored.join(', ')}`);
      }
      idleCount = 0;
      lastDeadCount = 0;
    } else {
      idleCount++;

      if (idleCount === 1) {
        log(`No active connections on any monitored port — starting grace period (${grace_checks} checks)`);
      }

      log(`Idle check ${idleCount} / ${grace_checks}`);

      if (idleCount >= grace_checks) {
        await notify('shutdown', `Idle for ${idleCount} checks`);
        executeShutdown(shutdown_command, dryRun);
        if (!dryRun) process.exit(0);
        idleCount = 0;
      }
    }
  }

  check();
  setInterval(check, checkIntervalMs);
}

module.exports = { run };
