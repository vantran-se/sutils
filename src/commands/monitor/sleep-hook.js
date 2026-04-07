#!/usr/bin/env node

/**
 * systemd sleep hook for sutils-monitor
 * Restarts the monitor service after system resume from suspend/hibernate
 *
 * Install as: /lib/systemd/system-sleep/sutils-monitor
 */

const { execSync } = require('child_process');

const SERVICE_NAME = 'sutils-monitor';

function log(message) {
  console.log(`[${new Date().toISOString()}] [sutils:sleep-hook] ${message}`);
}

function main() {
  const [,, action, phase] = process.argv;

  // systemd passes: action (pre/post) and phase (suspend/hibernate/hybrid-sleep/suspend-then-hibernate)
  if (!action || !phase) {
    log('No action/phase provided - exiting');
    return;
  }

  // Only act on 'post' phase (after resume)
  if (action !== 'post') {
    log(`Ignoring action=${action}, phase=${phase}`);
    return;
  }

  log(`System resuming from ${phase}, restarting ${SERVICE_NAME}...`);

  try {
    // Wait a moment for network to initialize
    log('Waiting 2s for network initialization...');
    execSync('sleep 2');

    // Reset failed state if any
    execSync(`systemctl reset-failed ${SERVICE_NAME} 2>/dev/null || true`);

    // Restart the service
    execSync(`systemctl restart ${SERVICE_NAME}`, { stdio: 'inherit' });

    log(`Successfully restarted ${SERVICE_NAME}`);
  } catch (err) {
    log(`Failed to restart service: ${err.message}`);
    process.exit(1);
  }
}

main();
