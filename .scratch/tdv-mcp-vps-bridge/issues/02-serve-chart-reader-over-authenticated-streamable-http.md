# 02 - Serve the chart-reader over authenticated Streamable HTTP

**What to build:** Add the production-facing Streamable HTTP MCP process that reuses the same chart-reader server factory as stdio, requires authentication in production, and stays healthy when the TradingView CDP dependency is offline or reconnecting.

**Blocked by:** 01 - Make the chart-reader manual-lifecycle and session-safe

**Status:** ready-for-agent

- [ ] A black-box MCP client can initialize, list tools, and call representative chart-reader tools through the real HTTP server process.
- [ ] `tools/list` matches the shared chart-reader catalog and does not advertise `tv_launch`.
- [ ] Production authentication failures are rejected before MCP tool execution; credentials come from deployment configuration rather than committed files.
- [ ] CDP unavailability returns a structured tool error without terminating the HTTP service, and a later call succeeds after the controlled bridge/CDP fixture returns without restarting MCP.
- [ ] Concurrent MCP sessions keep snapshot state isolated, concurrent read calls do not corrupt the cached CDP connection, and graceful shutdown closes active transports cleanly.