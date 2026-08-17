# 05 - Prove the real remote TradingView workflow end to end

**What to build:** Validate the production workflow through the real remote path from an MCP client over HTTPS to the VPS service, through the reverse CDP bridge, into TradingView Desktop on the PC, proving the user only needs to open TradingView for chart tools to become available.

**Blocked by:** 04 - Package the always-on VPS service and secure ingress

**Status:** ready-for-agent

- [ ] With TradingView closed, the VPS MCP endpoint stays online and chart-dependent calls report TradingView/CDP unavailable without attempting to launch it.
- [ ] Opening TradingView manually makes `chart_get_state` succeed without restarting MCP or the bridge, and closing/reopening TradingView recovers on later calls.
- [ ] Screenshot capture returns inline image content through the remote MCP path.
- [ ] Snapshot, temporary navigation, and restore work through the remote path and restore the user's chart state.
- [ ] Restarting the bridge does not require restarting MCP, restarting MCP does not terminate TradingView, and the existing local stdio/Secure Tunnel compatibility path remains functional apart from the intentional no-auto-launch behavior.