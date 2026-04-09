const { execSync } = require('child_process');
const net = require('net');

// Match Linux ss format: addr:port addr:port
// Handles IPv4 (1.2.3.4:80), IPv6 ([::1]:80), and wildcard (*:80)
const LOCAL_PORT_RE = /(?:[\d.[\]a-fA-F:*]+):(\d+)\s+(?:[\d.[\]a-fA-F:*]+):\d+/;

// Connection states that indicate a dead connection (terminal states)
const DEAD_STATES = ['close-wait', 'time-wait', 'fin-wait-1', 'fin-wait-2', 'closing', 'last-ack'];

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

function getListeningPorts() {
  try {
    const output = execSync('ss -tln', { encoding: 'utf8' });
    const ports = [];

    for (const line of output.trim().split('\n')) {
      if (line.includes('Local Address')) continue;
      // ss -tln format: State Recv-Q Send-Q Local Address:Port Peer Address:Port
      // But for listening sockets, we just need to extract port from Local Address
      // Match patterns like: *:443, 0.0.0.0:443, [::]:443, 127.0.0.1:443
      const match = line.match(/[:\[]([\d]+)\s+\S+\s+LISTEN/);
      if (match) {
        const port = parseInt(match[1], 10);
        if (port > 0 && port <= 65535) ports.push(port);
      }
    }

    return ports;
  } catch {
    return [];
  }
}

function getAllConnectionStates() {
  // Get all TCP connections with their states and timer info using ss -tno
  // The -o flag shows timer information including idle time
  try {
    const output = execSync('ss -tno state all', { encoding: 'utf8' });
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

          // Extract idle time from timer info (e.g., "timer:(idle,1200ms,0)")
          let idleMs = 0;
          const timerMatch = line.match(/timer:\((\w+),(\d+)ms/);
          if (timerMatch) {
            idleMs = parseInt(timerMatch[2], 10);
          }

          connections.push({ port, state, idleMs });
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
    idleThresholdMs = 30000, // connections idle longer than this are considered dead
    checkListening = true, // consider ports active if they have a listening server
  } = options;

  let activePorts = [];
  let allConnections = [];
  let deadConnections = 0;
  let idleConnections = 0;
  let listeningPorts = [];

  // Step 1: Get all connections with their states and idle times
  try {
    allConnections = getAllConnectionStates();

    // Filter out connections in dead/dying states
    const healthyConnections = allConnections.filter(
      (conn) => !DEAD_STATES.includes(conn.state)
    );

    // Count idle connections (ESTABLISHED but no activity for too long)
    idleConnections = healthyConnections.filter(
      (conn) => conn.idleMs > idleThresholdMs
    ).length;

    // Active ports = connections that are not in a dead state and not idle for too long
    activePorts = healthyConnections
      .filter((conn) => conn.idleMs <= idleThresholdMs)
      .map((conn) => conn.port);

    deadConnections = allConnections.filter((conn) =>
      DEAD_STATES.includes(conn.state)
    ).length;
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

  // Step 1b: Also get listening ports (server sockets)
  if (checkListening) {
    listeningPorts = getListeningPorts();
    console.log(`Debug: Listening ports detected: ${listeningPorts.join(', ')}`);
  }

  // A port is considered active if:
  // 1. It has an established connection (not dead/idle), OR
  // 2. It has a listening server (checkListening option)
  const activeMonitored = monitoredPorts.filter((p) =>
    activePorts.includes(p) || listeningPorts.includes(p)
  );

  // Step 2: Verify active connections are actually reachable
  let verifiedPorts = activeMonitored;
  let unreachablePorts = [];

  if (checkConnectivity && activeMonitored.length > 0) {
    const connectivityResults = await checkPortConnectivity(activeMonitored, timeoutMs);
    verifiedPorts = connectivityResults
      .filter((r) => r.reachable)
      .map((r) => r.port);
    unreachablePorts = connectivityResults
      .filter((r) => !r.reachable)
      .map((r) => r.port);
  }

  return {
    activeMonitored: verifiedPorts,
    deadConnections,
    idleConnections,
    unreachablePorts,
    hasActiveConnections: verifiedPorts.length > 0,
  };
}

module.exports = { checkPorts, checkPortConnectivity, getAllConnectionStates };
