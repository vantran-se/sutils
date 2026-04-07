const { execSync } = require('child_process');

function executeShutdown(command, dryRun = false) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [sutils:monitor] No active connections detected for grace period.`);

  if (dryRun) {
    console.log(`[${timestamp}] [sutils:monitor] DRY RUN – would execute: ${command}`);
    return;
  }

  console.log(`[${timestamp}] [sutils:monitor] Initiating shutdown: ${command}`);

  try {
    // Execute the command synchronously to ensure it starts before we exit
    // Use execSync with timeout to avoid hanging if suspend fails
    const { execSync } = require('child_process');

    execSync(command, {
      stdio: 'ignore',
      timeout: 5000
    });
  } catch (err) {
    console.error(`[${timestamp}] [sutils:monitor] Shutdown command failed: ${err.message}`);
    console.error('Make sure the process has permission to run the shutdown command.');
    process.exit(1);
  }
}

module.exports = { executeShutdown };
