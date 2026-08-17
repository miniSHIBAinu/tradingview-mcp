# 04 - Package the always-on VPS service and secure ingress

**What to build:** Package the HTTP chart-reader and reverse-CDP endpoint as an always-on VPS deployment with supervised process lifecycle, HTTPS ingress, production authentication, loopback-only internal listeners, and deployment configuration that keeps secrets out of the repository.

**Blocked by:** 02 - Serve the chart-reader over authenticated Streamable HTTP; 03 - Keep the PC-to-VPS CDP bridge running automatically

**Status:** ready-for-agent

- [x] The MCP service is supervised on the VPS and restarts independently of TradingView or the PC-side bridge.
- [x] Public access is HTTPS-only and authenticated, while the MCP listener and bridged CDP endpoint remain bound to loopback/private boundaries as designed.
- [x] Production secrets are injected through deployment configuration and are absent from committed files, logs, health responses, and examples.
- [x] VPS startup succeeds when the PC, bridge, or TradingView is offline and exposes clear service-versus-dependency health signals.
- [x] The primary VPS deployment does not require the local OpenAI Secure MCP Tunnel, while the existing stdio/Secure Tunnel compatibility path remains usable unless explicitly retired.

## Comments

- Packaged always-on systemd service unit `deploy/systemd/tdv-mcp.service` pointing to `src/server-http.js` with auto-restart and security hardening.
- Provided reverse proxy ingress configurations for Caddy (`deploy/caddy/Caddyfile`) and Nginx (`deploy/nginx/tdv-mcp.conf`) configured for SSE streaming and loopback forwarding to `127.0.0.1:3000`.
- Added sanitized deployment environment template `.env.example` with zero committed secrets.
- Authored complete deployment and operations guide in `docs/deployment/vps-bridge-setup.md`.
- Verified configuration validity and startup health semantics in `tests/deployment.test.js` (182 passing unit tests across suite).