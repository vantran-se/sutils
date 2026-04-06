const { execSync } = require('child_process');
const net = require('net');

// Match Linux ss format: addr:port addr:port
// Handles IPv4 (1.2.3.4:80), IPv6 ([::1]:80), and wildcard (*:80)
const LOCAL_PORT_RE = /(?:[\d.[\]a-fA-F:*]+):(\d+)\s+(?:[\d.[\]a-fA-F:*]+):\d+/;

// Connection states that indicate a potentially dead or dying connection
const DEAD_STATES = ['close-wait', 'time-wait', 'fin-wait-1', 'fin-wait-2', 'closing', 'last-ack', 'syn-sent', 'syn-recv'];

function getConnectionsViaSS(states = ['established']) {
  const stateFilter = states.map(s => `state ${s}`).join(' ');
  const output = execSync(`ss -tn ${stateFilter}`, { encoding: 'utf8' });
  const ports = [];

  for (const line of output.trim().split('\n')) {
    if (line.includes('Local Address')) continue;
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

function getAllConnectionStates() {
  // Get all TCP connections with their states using ss
  try {
    const output = execSync('ss -tn state all', { encoding: 'utf8' });
    const connections = [];

    for (const line of output.trim().split('\n')) {
      if (line.includes('Local Address')) continue;
      const match = line.match(LOCAL_PORT_RE);
      if (match) {
        const port = parseInt(match[1], 10);
        if (port > 0 && port <= 65535) {
          // Extract the connection state (last word in the line)
          const parts = line.trim().split(/\s+/);
          const state = parts[parts.length - 1].toLowerCase();
          connections.push({ port, state });
        }
      }
    }

    return connections;
  } catch {
    // Fallback to netstat (only reports ESTABLISHED, no state details)
    return [];
  }
}

function testPortConnectivity(port, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const cleanup = () => {
      socket.destroy();
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(false);
      }
    }, timeoutMs);

    socket.on('connect', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        cleanup();
        resolve(true);
      }
    });

    socket.on('error', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(false);
      }
    });

    // Try to connect to localhost on the specified port
    socket.connect(port, '127.0.0.1');
  });
}

async function checkPortConnectivity(ports, timeoutMs = 1000) {
  const results = [];
  for (const port of ports) {
    const isReachable = await testPortConnectivity(port, timeoutMs);
    results.push({ port, reachable: isReachable });
  }
  return results;
}

async function checkPorts(monitoredPorts, options = {}) {
  const {
    timeoutMs = 1000,
    checkConnectivity = true,
    skipConnectivityPorts = [],
  } = options;

  let activePorts = [];
  let allConnections = [];
  let deadConnections = [];

  // Step 1: Get all connections with their states
  try {
    allConnections = getAllConnectionStates();

    // Filter out connections in dead/dying states
    const healthyConnections = allConnections.filter(
      (conn) => !DEAD_STATES.includes(conn.state)
    );

    activePorts = healthyConnections.map((conn) => conn.port);
    deadConnections = allConnections.filter((conn) =>
      DEAD_STATES.includes(conn.state)
    );
  } catch {
    try {
      activePorts = getConnectionsViaSS(['established']);
    } catch {
      try {
        activePorts = getConnectionsViaNetstat();
      } catch (err) {
        throw new Error(
          `Could not run ss or netstat to check connections: ${err.message}`
        );
      }
    }
  }

  const activeMonitored = monitoredPorts.filter((p) => activePorts.includes(p));

  // Step 2: Verify active connections are actually reachable
  // Skip connectivity test for specified ports (e.g., SSH to avoid false negatives)
  let verifiedPorts = activeMonitored;
  let unreachablePorts = [];

  if (checkConnectivity && activeMonitored.length > 0) {
    const portsToTest = activeMonitored.filter(
      (p) => !skipConnectivityPorts.includes(p)
    );
    const portsSkipped = activeMonitored.filter((p) =>
      skipConnectivityPorts.includes(p)
    );

    // Skipped ports are considered reachable if they're in activeMonitored
    verifiedPorts = [...portsSkipped];

    if (portsToTest.length > 0) {
      const connectivityResults = await checkPortConnectivity(portsToTest, timeoutMs);
      verifiedPorts.push(
        ...connectivityResults
          .filter((r) => r.reachable)
          .map((r) => r.port)
      );
      unreachablePorts = connectivityResults
        .filter((r) => !r.reachable)
        .map((r) => r.port);
    }
  }

  return {
    activeMonitored: verifiedPorts,
    deadConnections: deadConnections.length,
    unreachablePorts,
    hasActiveConnections: verifiedPorts.length > 0,
  };
}

module.exports = { checkPorts, checkPortConnectivity, getAllConnectionStates };
