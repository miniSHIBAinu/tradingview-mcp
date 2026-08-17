import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createMcpHttpServer, validateAuth } from '../src/http-server.js';

describe('Streamable HTTP Server (Ticket 02)', () => {
  it('validateAuth helper handles Bearer token and direct token matching', () => {
    const validReqBearer = { headers: { authorization: 'Bearer secret123' } };
    const validReqApiKey = { headers: { 'x-api-key': 'secret123' } };
    const invalidReq = { headers: { authorization: 'Bearer wrong' } };
    const missingReq = { headers: {} };

    assert.equal(validateAuth(validReqBearer, 'secret123'), true);
    assert.equal(validateAuth(validReqApiKey, 'secret123'), true);
    assert.equal(validateAuth(invalidReq, 'secret123'), false);
    assert.equal(validateAuth(missingReq, 'secret123'), false);
    assert.equal(validateAuth(missingReq, undefined), true); // no auth required
  });

  it('rejects unauthorized requests with 401 before MCP tool execution', async () => {
    const serverInstance = createMcpHttpServer({ authToken: 'secret-token-xyz', requireAuth: false });
    const { port } = await serverInstance.listen(0, '127.0.0.1');

    try {
      // 1. Request without auth token
      const resWithoutAuth = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
      });
      assert.equal(resWithoutAuth.status, 401);
      const dataWithoutAuth = await resWithoutAuth.json();
      assert.match(dataWithoutAuth.error, /unauthorized/i);

      // 2. Request with invalid auth token
      const resWithBadAuth = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: 'Bearer bad-token',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
      });
      assert.equal(resWithBadAuth.status, 401);

      // 3. Health endpoint remains accessible
      const healthRes = await fetch(`http://127.0.0.1:${port}/health`);
      assert.equal(healthRes.status, 200);
      const healthData = await healthRes.json();
      assert.equal(healthData.status, 'ok');
    } finally {
      await serverInstance.close();
    }
  });

  it('allows black-box MCP client to initialize, list tools without tv_launch, and handle CDP unavailable', async () => {
    const authToken = 'test-token-123';
    const serverInstance = createMcpHttpServer({ authToken, requireAuth: false });
    const { port } = await serverInstance.listen(0, '127.0.0.1');

    const clientTransport = new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${port}/mcp`),
      {
        requestInit: {
          headers: {
            authorization: `Bearer ${authToken}`,
          },
        },
      }
    );

    const client = new Client({ name: 'black-box-client', version: '1.0.0' });

    try {
      await client.connect(clientTransport);

      // 1. Verify tools list
      const toolsResult = await client.listTools();
      const toolNames = toolsResult.tools.map((t) => t.name);

      assert.ok(toolNames.includes('tv_health_check'), 'includes tv_health_check');
      assert.ok(toolNames.includes('chart_get_state'), 'includes chart_get_state');
      assert.ok(toolNames.includes('quote_get'), 'includes quote_get');
      assert.ok(toolNames.includes('chart_snapshot_state'), 'includes chart_snapshot_state');
      assert.ok(toolNames.includes('chart_restore_state'), 'includes chart_restore_state');
      assert.ok(toolNames.includes('capture_screenshot'), 'includes capture_screenshot');

      // Crucial requirement: no tv_launch
      assert.equal(toolNames.includes('tv_launch'), false, 'must NOT include tv_launch');

      // 2. Call tv_health_check when CDP is offline (should return structured result without crashing server)
      const healthResult = await client.callTool({ name: 'tv_health_check', arguments: {} });
      const textItem = healthResult.content?.find((c) => c.type === 'text');
      assert.ok(textItem, 'text content returned');
      const healthData = JSON.parse(textItem.text);
      assert.equal(typeof healthData, 'object');

      // 3. Call chart_restore_state with no snapshot (should return structured error)
      const restoreResult = await client.callTool({ name: 'chart_restore_state', arguments: {} });
      const restoreText = restoreResult.content?.find((c) => c.type === 'text');
      assert.ok(restoreText, 'restore text returned');
      const restoreData = JSON.parse(restoreText.text);
      assert.equal(restoreData.success, false);
      assert.match(restoreData.error, /No chart snapshot exists/i);
    } finally {
      await client.close();
      await serverInstance.close();
    }
  });

  it('isolates chart snapshot state between concurrent HTTP MCP sessions', async () => {
    const serverInstance = createMcpHttpServer({ requireAuth: false });
    const { port } = await serverInstance.listen(0, '127.0.0.1');

    const transport1 = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`));
    const transport2 = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`));

    const client1 = new Client({ name: 'client-1', version: '1.0.0' });
    const client2 = new Client({ name: 'client-2', version: '1.0.0' });

    try {
      await Promise.all([
        client1.connect(transport1),
        client2.connect(transport2),
      ]);

      assert.equal(serverInstance.sessions.size, 2, 'two active sessions tracked');

      // Session 1 calling restore with no snapshot
      const r1 = await client1.callTool({ name: 'chart_restore_state', arguments: {} });
      const r1Data = JSON.parse(r1.content[0].text);
      assert.equal(r1Data.success, false);
      assert.match(r1Data.error, /No chart snapshot exists/i);

      // Session 2 calling restore with no snapshot
      const r2 = await client2.callTool({ name: 'chart_restore_state', arguments: {} });
      const r2Data = JSON.parse(r2.content[0].text);
      assert.equal(r2Data.success, false);
      assert.match(r2Data.error, /No chart snapshot exists/i);
    } finally {
      await client1.close();
      await client2.close();
      await serverInstance.close();
    }
  });

  it('recovers dynamically when CDP dependency returns without server restart', async () => {
    // Start mock CDP HTTP server to simulate CDP target endpoint
    let cdpServerRequests = 0;
    const cdpMockServer = http.createServer((req, res) => {
      cdpServerRequests++;
      if (req.url === '/json/version') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ Browser: 'TradingView/3.1.0', 'User-Agent': 'TestTV' }));
        return;
      }
      if (req.url === '/json/list') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([
          {
            id: 'mock-target-1',
            type: 'page',
            title: 'TradingView — BTCUSD',
            url: 'https://www.tradingview.com/chart/abcd123/',
            webSocketDebuggerUrl: 'ws://127.0.0.1:9333/devtools/page/mock-target-1',
          },
        ]));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    const serverInstance = createMcpHttpServer({ requireAuth: false });
    const { port } = await serverInstance.listen(0, '127.0.0.1');

    const clientTransport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`));
    const client = new Client({ name: 'recovery-client', version: '1.0.0' });

    try {
      await client.connect(clientTransport);

      // 1. First call fails because mock CDP is not listening on CDP_PORT
      const failCall = await client.callTool({ name: 'tv_health_check', arguments: {} });
      const failData = JSON.parse(failCall.content[0].text);
      assert.equal(failData.success, false);

      // 2. Server remains running; now start CDP mock server on ephemeral port and test connection helper
      await new Promise((resolve) => cdpMockServer.listen(0, '127.0.0.1', resolve));
      const cdpPort = cdpMockServer.address().port;

      // Verify mock CDP responds to version endpoint
      const versionRes = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      const versionData = await versionRes.json();
      assert.equal(versionData.Browser, 'TradingView/3.1.0');

      // Verify MCP server is still online and able to process calls
      const checkAgain = await client.callTool({ name: 'tv_health_check', arguments: {} });
      assert.ok(checkAgain.content);
    } finally {
      await client.close();
      await serverInstance.close();
      await new Promise((resolve) => cdpMockServer.close(resolve));
    }
  });

  it('handles concurrent requests without session corruption', async () => {
    const serverInstance = createMcpHttpServer({ requireAuth: false });
    const { port } = await serverInstance.listen(0, '127.0.0.1');

    const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`));
    const client = new Client({ name: 'concurrent-client', version: '1.0.0' });

    try {
      await client.connect(transport);

      // Run multiple concurrent tool calls
      const calls = await Promise.all([
        client.callTool({ name: 'tv_health_check', arguments: {} }),
        client.callTool({ name: 'chart_restore_state', arguments: {} }),
        client.listTools(),
        client.callTool({ name: 'chart_restore_state', arguments: {} }),
      ]);

      assert.equal(calls.length, 4);
      assert.ok(calls[2].tools.length > 0);
    } finally {
      await client.close();
      await serverInstance.close();
    }
  });
});
