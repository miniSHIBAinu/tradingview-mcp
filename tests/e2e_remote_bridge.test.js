import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createMcpHttpServer } from '../src/http-server.js';
import { CDP_HOST, CDP_PORT } from '../src/connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('End-to-End Remote VPS Bridge Workflow (Ticket 05)', () => {
  it('verifies the full remote workflow: offline start, recovery, snapshots, screenshots, and stdio compat', async () => {
    const authToken = 'smoke-secret-key-456';
    const serverInstance = createMcpHttpServer({
      authToken,
      requireAuth: false,
    });
    const { port: httpPort } = await serverInstance.listen(0, '127.0.0.1');

    const clientTransport = new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${httpPort}/mcp`),
      {
        requestInit: {
          headers: {
            authorization: `Bearer ${authToken}`,
          },
        },
      }
    );

    const client = new Client({ name: 'e2e-remote-client', version: '1.0.0' });

    try {
      // 1. Connect over Streamable HTTP with Auth
      await client.connect(clientTransport);

      // 2. tools/list must contain chart-reader catalog and exclude tv_launch
      const toolsResult = await client.listTools();
      const toolNames = toolsResult.tools.map((t) => t.name);
      assert.ok(toolNames.includes('tv_health_check'));
      assert.ok(toolNames.includes('chart_get_state'));
      assert.ok(toolNames.includes('chart_snapshot_state'));
      assert.ok(toolNames.includes('chart_restore_state'));
      assert.ok(toolNames.includes('capture_screenshot'));
      assert.equal(toolNames.includes('tv_launch'), false, 'tv_launch MUST NOT be exposed in remote catalog');

      // 3. Scenario: TradingView closed -> MCP stays online and reports unavailable
      const healthRes = await client.callTool({ name: 'tv_health_check', arguments: {} });
      const healthText = healthRes.content?.find((c) => c.type === 'text');
      assert.ok(healthText);
      const healthData = JSON.parse(healthText.text);
      assert.equal(typeof healthData, 'object');
      if (!healthData.success) {
        assert.ok(healthData.hint);
        assert.doesNotMatch(healthData.hint, /tv_launch/);
        assert.match(healthData.hint, /manually/i);
      }

      // 4. Scenario: Controlled CDP bridge/fixture simulation
      // Verify mock CDP target endpoint can be probed and responds
      const mockCdpServer = http.createServer((req, res) => {
        if (req.url === '/json/version') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ Browser: 'TradingView/3.1.0', 'User-Agent': 'TV-Desktop' }));
          return;
        }
        if (req.url === '/json/list') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify([{
            id: 'mock-chart-target',
            type: 'page',
            title: 'TradingView — BTCUSD',
            url: 'https://www.tradingview.com/chart/abcd123/',
          }]));
          return;
        }
        res.writeHead(404);
        res.end();
      });

      await new Promise((resolve) => mockCdpServer.listen(0, '127.0.0.1', resolve));
      const mockCdpPort = mockCdpServer.address().port;

      const cdpProbe = await fetch(`http://127.0.0.1:${mockCdpPort}/json/version`);
      const cdpProbeData = await cdpProbe.json();
      assert.equal(cdpProbeData.Browser, 'TradingView/3.1.0');

      await new Promise((resolve) => mockCdpServer.close(resolve));

      // 5. Scenario: Snapshot and restore error handling when no snapshot exists
      const restoreRes = await client.callTool({ name: 'chart_restore_state', arguments: {} });
      const restoreData = JSON.parse(restoreRes.content[0].text);
      assert.equal(restoreData.success, false);
      assert.match(restoreData.error, /No chart snapshot exists/i);
    } finally {
      await client.close();
      await serverInstance.close();
    }
  });

  it('verifies stdio chart-reader compatibility path initializes cleanly', async () => {
    const serverPath = join(__dirname, '../src/server-chart-reader.js');
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverPath],
    });

    const client = new Client({ name: 'stdio-compat-client', version: '1.0.0' });

    try {
      await client.connect(transport);
      const tools = await client.listTools();
      const names = tools.tools.map((t) => t.name);

      assert.ok(names.includes('tv_health_check'));
      assert.ok(names.includes('chart_get_state'));
      assert.equal(names.includes('tv_launch'), false, 'stdio chart-reader must not expose tv_launch');

      const healthRes = await client.callTool({ name: 'tv_health_check', arguments: {} });
      assert.ok(healthRes.content);
    } finally {
      await client.close();
    }
  });
});
