# 03 - Keep the PC-to-VPS CDP bridge running automatically

**What to build:** Provide a generic outbound reverse bridge that automatically keeps the PC's TradingView CDP endpoint available as VPS loopback `127.0.0.1:9333`, without containing MCP business logic, requiring inbound access to the PC, or controlling TradingView application lifecycle.

**Blocked by:** None - can start immediately

**Status:** ready-for-agent

- [x] The bridge forwards VPS loopback `127.0.0.1:9333` to PC loopback `127.0.0.1:9333` and never exposes the CDP listener on a public interface.
- [x] The bridge can start before TradingView, remain idle while CDP is absent, and pass traffic once the user opens TradingView without manual bridge restart.
- [x] The bridge auto-starts in the user's Windows session and reconnects after transient network/VPS disconnections without requiring an interactive terminal.
- [x] No bridge code starts, kills, or restarts TradingView and no MCP/tool logic is hosted on the PC-side bridge.
- [x] Operational status and failure diagnostics distinguish bridge connectivity from TradingView/CDP availability without logging credentials.

## Comments

- Implemented outbound reverse SSH bridge configuration builder in `src/bridge/config.js` enforcing loopback-only binding (`127.0.0.1:9333:127.0.0.1:9333`).
- Created non-interactive bridge supervisor scripts for Windows PowerShell (`scripts/bridge/bridge-supervisor.ps1`) and Unix Bash (`scripts/bridge/bridge-supervisor.sh`) with exponential reconnect backoff.
- Created Windows scheduled task installation and uninstallation scripts (`scripts/bridge/install-windows-task.ps1` and `scripts/bridge/uninstall-windows-task.ps1`).
- Added bridge diagnostic status checker `src/bridge/status.js` and CLI commands `tv bridge status` and `tv bridge config`.
- Verified via script security audit and unit tests in `tests/bridge.test.js` that no bridge code contains TradingView lifecycle management or MCP logic. (176 passing tests in full unit suite).