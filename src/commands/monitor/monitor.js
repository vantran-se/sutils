const { execSync } = require('child_process');

function parseLocalPort(addressPort) {
  const lastColon = addressPort.lastIndexOf(':');
  if (lastColon === -1) return NaN;
  return parseInt(addressPort.substring(lastColon + 1), 10);
}

function getConnectionsViaSS() {
  const output = execSync('ss -tn state established', { encoding: 'utf8' });
  const ports = [];

  for (const line of output.trim().split('\n').slice(1)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;
    const port = parseLocalPort(parts[3]);
    if (!isNaN(port)) ports.push(port);
  }

  return ports;
}

function getConnectionsViaNetstat() {
  const output = execSync('netstat -tn 2>/dev/null | grep ESTABLISHED', {
    encoding: 'utf8',
    shell: true,
  });
  const ports = [];

  for (const line of output.trim().split('\n')) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 6) continue;
    const port = parseLocalPort(parts[3]);
    if (!isNaN(port)) ports.push(port);
  }

  return ports;
}

function checkPorts(monitoredPorts) {
  let activePorts;

  try {
    activePorts = getConnectionsViaSS();
  } catch {
    try {
      activePorts = getConnectionsViaNetstat();
    } catch (err) {
      throw new Error(
        `Could not run ss or netstat to check connections: ${err.message}`
      );
    }
  }

  const activeMonitored = monitoredPorts.filter((p) => activePorts.includes(p));

  return {
    activeMonitored,
    hasActiveConnections: activeMonitored.length > 0,
  };
}

module.exports = { checkPorts };
