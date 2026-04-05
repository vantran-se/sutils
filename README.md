# sutils

[![CI](https://github.com/vantran-se/sutils/actions/workflows/ci.yml/badge.svg)](https://github.com/vantran-se/sutils/actions/workflows/ci.yml)
[![Publish](https://github.com/vantran-se/sutils/actions/workflows/publish.yml/badge.svg)](https://github.com/vantran-se/sutils/actions/workflows/publish.yml)

Server utilities CLI for Linux — auto-shutdown, startup scripts, and more.

**Requirements:** Linux · systemd · Node.js >= 16

```bash
npm install -g @vantran-se/sutils
```

---

## Commands

| Command | What it does |
|---|---|
| `sutils monitor` | Auto-shutdown when all ports are idle |
| `sutils startup` | Run scripts automatically at server boot |
| `sutils restart` | Restart all enabled sutils services at once |
| `sutils disable` | Stop and disable all enabled sutils services |
| `sutils update` | Update sutils to latest and restart services |
| `sutils uninstall` | Remove all services and uninstall sutils |

---

## monitor

Shuts down the server when all watched ports have been idle for a configured period. Useful for keeping cloud costs down.

**Quick start**

```bash
sutils monitor init          # create ~/.sutils/config.yaml
nano ~/.sutils/config.yaml   # edit ports, grace period, etc.
sutils monitor enable        # install systemd service
sutils monitor start         # start it now
```

**Config** (`~/.sutils/config.yaml`)

```yaml
check_interval: 60           # seconds between connection checks
grace_checks: 15             # number of idle checks before shutdown
shutdown_command: "sudo shutdown -h now"

ports:
  - 22    # SSH
  - 3000  # your app

# notify:
#   telegram:
#     bot_token: "..."
#     chat_id: "..."
```

**Subcommands**

```
init      Create config.yaml
enable    Install systemd service
start     Start now + enable on boot
stop      Stop (stays enabled on boot)
disable   Remove from boot
status    Show service status
run       Run in foreground (--dry-run to test without shutting down)
```

**Sudo for shutdown**

```bash
# /etc/sudoers.d/sutils
your-user ALL=(ALL) NOPASSWD: /sbin/shutdown
```

---

## startup

Registers scripts as systemd one-shot services that run at every boot.

**Quick start**

```bash
sutils startup init          # create ~/.sutils/config.yaml (skip if already done by monitor init)
nano ~/.sutils/config.yaml   # add a scripts: section
sutils startup enable        # register services
```

**Config** (`~/.sutils/config.yaml`)

```yaml
scripts:
  - name: setup-env
    run: /home/ubuntu/setup-env.sh
    # user: ubuntu    # optional: run as this user

  - name: start-app
    run: /home/ubuntu/start-app.sh
```

**Subcommands**

```
init      Create config.yaml (skip if already created by monitor init)
enable    Register scripts as systemd services
disable   Remove scripts from systemd
run       Run all scripts now (via systemctl start)
status    Show status of each script's service
```

---

## License

MIT
