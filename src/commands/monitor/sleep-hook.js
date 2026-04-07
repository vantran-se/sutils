#!/bin/sh
# systemd sleep hook for sutils-monitor
# Restarts the monitor service after system resume from suspend/hibernate
#
# Install as: /lib/systemd/system-sleep/sutils-monitor

ACTION="$1"
PHASE="$2"

# Only act on 'post' phase (after resume)
if [ "$ACTION" != "post" ]; then
    exit 0
fi

# Log to syslog
logger -t sutils-sleep "System resuming from $PHASE, restarting sutils-monitor..."

# Wait for network to initialize
sleep 2

# Reset failed state and restart service
systemctl reset-failed sutils-monitor 2>/dev/null || true
systemctl restart sutils-monitor

logger -t sutils-sleep "Restarted sutils-monitor service"
exit 0
