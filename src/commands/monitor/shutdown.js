const { spawn } = require('child_process');

function executeShutdown(command, dryRun = false) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [sutils:monitor] No active connections detected for grace period.`);

  if (dryRun) {
    console.log(`[${timestamp}] [sutils:monitor] DRY RUN – would execute: ${command}`);
    return;
  }

  console.log(`[${timestamp}] [sutils:monitor] Initiating shutdown: ${command}`);

  try {
    // Execute the command asynchronously and exit immediately
    // This prevents the service from being killed during system suspend
    spawn(command, [], {
      detached: true,
      stdio: 'ignore',
      shell: true
    }).unref();

    // Exit cleanly before the system suspends
    process.exit(0);
  } catch (err) {
    console.error(`[${timestamp}] [sutils:monitor] Shutdown command failed: ${err.message}`);
    console.error('Make sure the process has permission to run the shutdown command.');
    process.exit(1);
  }
}

module.exports = { executeShutdown };
