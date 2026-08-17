# 01 - Make the chart-reader manual-lifecycle and session-safe

**What to build:** Refactor the ChatGPT chart-reader into a reusable per-session MCP server factory while keeping the current stdio workflow functional. The chart-reader must no longer expose `tv_launch`, must not automatically start, kill, or restart TradingView, and must isolate mutable snapshot/restore state per MCP session.

**Blocked by:** None - can start immediately

**Status:** ready-for-agent

- [ ] The stdio chart-reader still initializes and serves its existing ChatGPT-oriented tool surface, except `tv_launch` is absent.
- [ ] `tv_health_check` reports TradingView/CDP unavailability without instructing callers to auto-launch the app.
- [ ] MCP/tunnel startup paths do not invoke TradingView launch/kill/restart behavior when CDP is unavailable.
- [ ] Chart snapshot/restore state is scoped per MCP server/session instance rather than process-global state.
- [ ] Existing manual launch helpers may remain available for explicit user invocation and are covered independently from the ChatGPT server path.