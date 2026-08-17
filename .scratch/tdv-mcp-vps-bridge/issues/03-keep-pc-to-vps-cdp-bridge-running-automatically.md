# 03 - Keep the PC-to-VPS CDP bridge running automatically

**What to build:** Provide a generic outbound reverse bridge that automatically keeps the PC's TradingView CDP endpoint available as VPS loopback `127.0.0.1:9333`, without containing MCP business logic, requiring inbound access to the PC, or controlling TradingView application lifecycle.

**Blocked by:** None - can start immediately

**Status:** ready-for-agent

- [ ] The bridge forwards VPS loopback `127.0.0.1:9333` to PC loopback `127.0.0.1:9333` and never exposes the CDP listener on a public interface.
- [ ] The bridge can start before TradingView, remain idle while CDP is absent, and pass traffic once the user opens TradingView without manual bridge restart.
- [ ] The bridge auto-starts in the user's Windows session and reconnects after transient network/VPS disconnections without requiring an interactive terminal.
- [ ] No bridge code starts, kills, or restarts TradingView and no MCP/tool logic is hosted on the PC-side bridge.
- [ ] Operational status and failure diagnostics distinguish bridge connectivity from TradingView/CDP availability without logging credentials.