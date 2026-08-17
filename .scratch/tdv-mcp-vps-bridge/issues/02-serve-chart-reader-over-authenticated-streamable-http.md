# 02 - Serve the chart-reader over authenticated Streamable HTTP

**What to build:** Add the production-facing Streamable HTTP MCP process that reuses the same chart-reader server factory as stdio, requires authentication in production, and stays healthy when the TradingView CDP dependency is offline or reconnecting.

**Blocked by:** 01 - Make the chart-reader manual-lifecycle and session-safe

**Status:** ready-for-agent

- [x] A black-box MCP client can initialize, list tools, and call representative chart-reader tools through the real HTTP server process.
- [x] `tools/list` matches the shared chart-reader catalog and does not advertise `tv_launch`.
- [x] Production authentication failures are rejected before MCP tool execution; credentials come from deployment configuration rather than committed files.
- [x] CDP unavailability returns a structured tool error without terminating the HTTP service, and a later call succeeds after the controlled bridge/CDP fixture returns without restarting MCP.
- [x] Concurrent MCP sessions keep snapshot state isolated, concurrent read calls do not corrupt the cached CDP connection, and graceful shutdown closes active transports cleanly.

## Comments

- Built Streamable HTTP MCP server module `src/http-server.js` and executable entrypoint `src/server-http.js`.
- Integrated token authentication supporting `Authorization: Bearer <token>` and `x-api-key: <token>` configured via environment variables.
- Maintained active sessions in-memory with per-session `createChartReaderServer()` factory instance, ensuring complete chart snapshot isolation.
- Exposed unauthenticated `/health` endpoint for external process/supervisor health checks.
- Verified dynamic recovery when CDP endpoint is offline/online without requiring server restart.
- Added comprehensive black-box integration tests in `tests/http_server.test.js` (6 passing tests, 170 passing tests across entire unit suite).