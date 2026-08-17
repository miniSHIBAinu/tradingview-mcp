# 04 - Package the always-on VPS service and secure ingress

**What to build:** Package the HTTP chart-reader and reverse-CDP endpoint as an always-on VPS deployment with supervised process lifecycle, HTTPS ingress, production authentication, loopback-only internal listeners, and deployment configuration that keeps secrets out of the repository.

**Blocked by:** 02 - Serve the chart-reader over authenticated Streamable HTTP; 03 - Keep the PC-to-VPS CDP bridge running automatically

**Status:** ready-for-agent

- [ ] The MCP service is supervised on the VPS and restarts independently of TradingView or the PC-side bridge.
- [ ] Public access is HTTPS-only and authenticated, while the MCP listener and bridged CDP endpoint remain bound to loopback/private boundaries as designed.
- [ ] Production secrets are injected through deployment configuration and are absent from committed files, logs, health responses, and examples.
- [ ] VPS startup succeeds when the PC, bridge, or TradingView is offline and exposes clear service-versus-dependency health signals.
- [ ] The primary VPS deployment does not require the local OpenAI Secure MCP Tunnel, while the existing stdio/Secure Tunnel compatibility path remains usable unless explicitly retired.