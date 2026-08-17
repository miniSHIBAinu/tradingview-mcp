#!/usr/bin/env node
/**
 * Smoke test for the TDV MCP VPS Streamable HTTP service.
 * Connects over HTTP, checks health, tools list, chart state, snapshots, and screenshots.
 *
 * Usage:
 *   node scripts/smoke-remote-bridge.mjs [url] [token]
 * Example:
 *   node scripts/smoke-remote-bridge.mjs http://127.0.0.1:3000/mcp secret123
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const mcpUrl = process.argv[2] || process.env.TV_MCP_URL || 'http://127.0.0.1:3000/mcp';
const authToken = process.argv[3] || process.env.TDV_MCP_AUTH_TOKEN || process.env.MCP_AUTH_TOKEN;

console.log(`[smoke] Target URL: ${mcpUrl}`);
console.log(`[smoke] Auth: ${authToken ? 'Bearer token configured' : 'None'}`);

const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
  requestInit: {
    headers: {
      ...(authToken && { authorization: `Bearer ${authToken}` }),
    },
  },
});

const client = new Client({ name: 'tdv-remote-smoke', version: '1.0.0' });

function unwrap(res) {
  const text = res?.content?.find((c) => c.type === 'text')?.text;
  try { return JSON.parse(text); } catch { return text; }
}

async function run() {
  try {
    console.log('[smoke] Connecting to Streamable HTTP MCP server...');
    await client.connect(transport);
    console.log('[smoke] Connected successfully!');

    // 1. List tools
    const toolsResult = await client.listTools();
    const toolNames = toolsResult.tools.map((t) => t.name);
    console.log(`[smoke] Available tools (${toolNames.length}):`, toolNames.join(', '));

    if (toolNames.includes('tv_launch')) {
      console.error('[smoke] FAIL: tv_launch must not be in remote tool catalog!');
      process.exitCode = 1;
      return;
    }
    console.log('[smoke] PASS: tv_launch is absent from tool catalog.');

    // 2. Health check
    console.log('[smoke] Calling tv_health_check...');
    const health = unwrap(await client.callTool({ name: 'tv_health_check', arguments: {} }));
    console.log('[smoke] Health result:', JSON.stringify(health, null, 2));

    if (health?.success) {
      console.log(`[smoke] PASS: TradingView CDP is online (${health.chart_symbol}, ${health.chart_resolution})`);

      // 3. Snapshot state
      console.log('[smoke] Testing chart_snapshot_state...');
      const snapshot = unwrap(await client.callTool({ name: 'chart_snapshot_state', arguments: {} }));
      console.log('[smoke] Snapshot:', JSON.stringify(snapshot));

      // 4. Restore state
      console.log('[smoke] Testing chart_restore_state...');
      const restore = unwrap(await client.callTool({ name: 'chart_restore_state', arguments: {} }));
      console.log('[smoke] Restore:', JSON.stringify(restore));

      // 5. Screenshot capture
      console.log('[smoke] Testing capture_screenshot...');
      const screenshot = await client.callTool({ name: 'capture_screenshot', arguments: {} });
      const imgItem = screenshot.content?.find((c) => c.type === 'image');
      if (imgItem) {
        console.log(`[smoke] PASS: Inline image returned (base64 size: ${imgItem.data.length} chars)`);
      } else {
        console.log('[smoke] Screenshot text response:', unwrap(screenshot));
      }
    } else {
      console.log('[smoke] TradingView/CDP is offline (expected when TradingView is not running locally).');
      console.log(`[smoke] Hint returned: ${health?.hint}`);
    }

    console.log('[smoke] ALL REMOTE SMOKE CHECKS PASSED.');
  } catch (err) {
    console.error('[smoke] ERROR:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
}

await run();
