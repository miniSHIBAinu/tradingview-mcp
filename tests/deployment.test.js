import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMcpHttpServer } from '../src/http-server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('VPS Deployment & Packaging (Ticket 04)', () => {
  describe('Systemd Service Configuration', () => {
    it('tdv-mcp.service is correctly configured with supervision and server-http.js entrypoint', () => {
      const content = readFileSync(join(__dirname, '../deploy/systemd/tdv-mcp.service'), 'utf-8');

      assert.match(content, /ExecStart=\/usr\/bin\/node src\/server-http\.js/);
      assert.match(content, /Restart=always/);
      assert.match(content, /RestartSec=5s/);
      assert.match(content, /NoNewPrivileges=true/);
      assert.match(content, /EnvironmentFile=-\/etc\/tdv-mcp\/tdv-mcp\.env/);
    });
  });

  describe('Reverse Proxy Ingress Configurations', () => {
    it('Caddyfile proxies to 127.0.0.1:3000 with SSE unbuffered streaming', () => {
      const content = readFileSync(join(__dirname, '../deploy/caddy/Caddyfile'), 'utf-8');

      assert.match(content, /reverse_proxy 127\.0\.0\.1:3000/);
      assert.match(content, /flush_interval -1/);
      assert.match(content, /Strict-Transport-Security/);
    });

    it('Nginx config proxies to http://127.0.0.1:3000 with buffering disabled', () => {
      const content = readFileSync(join(__dirname, '../deploy/nginx/tdv-mcp.conf'), 'utf-8');

      assert.match(content, /proxy_pass http:\/\/127\.0\.0\.1:3000/);
      assert.match(content, /proxy_buffering off/);
      assert.match(content, /proxy_cache off/);
      assert.match(content, /chunked_transfer_encoding on/);
    });
  });

  describe('Environment Configuration & Secrets Safety', () => {
    it('.env.example contains expected keys without real secrets', () => {
      const content = readFileSync(join(__dirname, '../.env.example'), 'utf-8');

      assert.match(content, /TDV_MCP_AUTH_TOKEN=/);
      assert.match(content, /TV_HTTP_PORT=3000/);
      // TV_CDP_PORT is project-specific: 9222 (Windows local) or 9333 (VPS default).
      // Just confirm the var is defined, not the exact value.
      assert.match(content, /TV_CDP_PORT=\d+/);
      assert.match(content, /TV_CDP_HOST=127\.0\.0\.1/);

      // Must NOT contain any hardcoded real secrets
      assert.doesNotMatch(content, /supersecret/i);
    });

    it('production server enforces TDV_MCP_AUTH_TOKEN requirement', () => {
      assert.throws(
        () => createMcpHttpServer({ authToken: undefined, requireAuth: true }),
        /TDV_MCP_AUTH_TOKEN is required in production environment/
      );
    });
  });

  describe('VPS Health Diagnostics', () => {
    it('HTTP /health endpoint reports service status independently of CDP dependency', async () => {
      const serverInstance = createMcpHttpServer({ requireAuth: false });
      const { port } = await serverInstance.listen(0, '127.0.0.1');

      try {
        const res = await fetch(`http://127.0.0.1:${port}/health`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.status, 'ok');
        assert.equal(data.service, 'tdv-mcp-http');
        assert.equal(typeof data.uptime, 'number');
        // cdp_target format: "host:port". Port varies by env (9333 default, 9222 on
        // Windows local). Just verify the format, not the literal port.
        assert.match(data.cdp_target, /^\S+:\d+$/);
      } finally {
        await serverInstance.close();
      }
    });
  });
});
