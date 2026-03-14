const { execSync } = require('child_process');

// Match the first addr:port pair in a line (local address).
// Handles IPv4 (1.2.3.4:80), IPv6 ([::1]:80), and wildcard (*:80).
// Column order varies across ss versions, so we use regex instead of index.
const LOCAL_PORT_RE = /(?:[\d.[\]a-fA-F:*]+):(\d+)\s+(?:[\d.[\]a-fA-F:*]+):\d+/;

function getConnectionsViaSS() {
  const output = execSync('ss -tn state established', { encoding: 'utf8' });
  const ports = [];

  for (const line of output.trim().split('\n')) {
    if (line.includes('Local Address')) continue; // skip header
    const match = line.match(LOCAL_PORT_RE);
    if (match) {
      const port = parseInt(match[1], 10);
      if (port > 0 && port <= 65535) ports.push(port);
    }
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
    const match = line.match(LOCAL_PORT_RE);
    if (match) {
      const port = parseInt(match[1], 10);
      if (port > 0 && port <= 65535) ports.push(port);
    }
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
