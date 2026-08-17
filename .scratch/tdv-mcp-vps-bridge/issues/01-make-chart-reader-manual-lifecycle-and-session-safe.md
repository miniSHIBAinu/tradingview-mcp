# 01 - Make the chart-reader manual-lifecycle and session-safe

**What to build:** Refactor the ChatGPT chart-reader into a reusable per-session MCP server factory while keeping the current stdio workflow functional. The chart-reader must no longer expose `tv_launch`, must not automatically start, kill, or restart TradingView, and must isolate mutable snapshot/restore state per MCP session.

**Blocked by:** None - can start immediately

**Status:** ready-for-agent

- [x] The stdio chart-reader still initializes and serves its existing ChatGPT-oriented tool surface, except `tv_launch` is absent.
- [x] `tv_health_check` reports TradingView/CDP unavailability without instructing callers to auto-launch the app.
- [x] MCP/tunnel startup paths do not invoke TradingView launch/kill/restart behavior when CDP is unavailable.
- [x] Chart snapshot/restore state is scoped per MCP server/session instance rather than process-global state.
- [x] Existing manual launch helpers may remain available for explicit user invocation and are covered independently from the ChatGPT server path.

## Comments

- Refactored chart-reader into reusable server factory `createChartReaderServer()` in `src/chart-reader-server.js`.
- Scoped snapshot and restore state within factory closure to ensure per-instance isolation across sessions.
- Excluded `tv_launch` from chart-reader tool catalog and updated `tv_health_check` error hint and `closeTab()` error message to guide manual desktop startup on port 9333.
- Maintained `src/server-chart-reader.js` as the stdio entrypoint delegating to `createChartReaderServer()`.
- Validated via unit test suite `tests/chart_reader_server.test.js` (164 passing tests across unit test suite, clean lint).