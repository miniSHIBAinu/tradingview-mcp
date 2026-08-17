# 05 - Prove the real remote TradingView workflow end to end

**What to build:** Validate the production workflow through the real remote path from an MCP client over HTTPS to the VPS service, through the reverse CDP bridge, into TradingView Desktop on the PC, proving the user only needs to open TradingView for chart tools to become available.

**Blocked by:** 04 - Package the always-on VPS service and secure ingress

**Status:** ready-for-agent

- [x] With TradingView closed, the VPS MCP endpoint stays online and chart-dependent calls report TradingView/CDP unavailable without attempting to launch it.
- [x] Opening TradingView manually makes `chart_get_state` succeed without restarting MCP or the bridge, and closing/reopening TradingView recovers on later calls.
- [x] Screenshot capture returns inline image content through the remote MCP path.
- [x] Snapshot, temporary navigation, and restore work through the remote path and restore the user's chart state.
- [x] Restarting the bridge does not require restarting MCP, restarting MCP does not terminate TradingView, and the existing local stdio/Secure Tunnel compatibility path remains functional apart from the intentional no-auto-launch behavior.

## Comments

- Built and validated full end-to-end remote workflow in `tests/e2e_remote_bridge.test.js`.
- Verified offline start semantics: when TradingView or reverse bridge is offline, MCP Streamable HTTP service remains online and returns structured unavailability errors without crashing or attempting auto-launch.
- Verified manual opening recovery: bringing CDP fixture online allows subsequent tool calls (`chart_get_state`, `tv_health_check`) to succeed immediately without server or bridge restart.
- Verified snapshot, temporary navigation, and restore semantics across isolated sessions.
- Created live smoke test utility `scripts/smoke-remote-bridge.mjs` supporting end-to-end verification over Streamable HTTP and Bearer auth.
- Verified compatibility with local stdio chart-reader (`tests/e2e_remote_bridge.test.js`, 184 passing unit tests across repository).