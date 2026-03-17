const { execFileSync } = require('child_process');

/**
 * Returns the names of all enabled sutils-*.service units.
 */
function listEnabledServices() {
  let output = '';
  try {
    output = execFileSync(
      'systemctl',
      ['list-unit-files', 'sutils-*.service', '--no-legend', '--no-pager', '--state=enabled'],
      { encoding: 'utf8' }
    );
  } catch {
    // systemctl exits non-zero when no units match — treat as empty
  }

  return output
    .split('\n')
    .map(line => line.trim().split(/\s+/)[0])
    .filter(name => name && name.endsWith('.service'));
}

/**
 * Runs a systemctl action on each service, logs progress, and exits 1 if any fail.
 * @param {string[]} services   - service unit names
 * @param {string[]} args       - systemctl args, e.g. ['restart'] or ['disable', '--now']
 * @param {string}   presentVerb - shown per-service, e.g. 'Restarting'
 * @param {string}   pastTense  - used in the summary line, e.g. 'restarted'
 */
function applyToServices(services, args, presentVerb, pastTense) {
  let failed = 0;
  for (const svc of services) {
    console.log(`${presentVerb} ${svc}...`);
    try {
      execFileSync('systemctl', [...args, svc], { stdio: 'inherit' });
    } catch (err) {
      console.error(`Failed: ${err.message}`);
      failed++;
    }
  }
  console.log(`\n${services.length - failed}/${services.length} service(s) ${pastTense}.`);
  if (failed > 0) process.exit(1);
}

module.exports = { listEnabledServices, applyToServices };
