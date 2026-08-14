import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const serverPath = fileURLToPath(new URL('../src/server-chart-reader.js', import.meta.url));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverPath],
});
const client = new Client({ name: 'tdv-restore-smoke', version: '1.0.0' });

function payload(result) {
  const text = result?.content?.find((item) => item.type === 'text')?.text;
  try { return JSON.parse(text); } catch { return text; }
}

async function call(name, args = {}) {
  return payload(await client.callTool({ name, arguments: args }));
}

function sameRange(a, b) {
  return a?.from === b?.from && a?.to === b?.to;
}

await client.connect(transport);
try {
  const initialState = await call('chart_get_state');
  const initialRange = await call('chart_get_visible_range');
  const snapshot = await call('chart_snapshot_state');
  console.log('INITIAL', JSON.stringify({
    symbol: initialState.symbol,
    resolution: initialState.resolution,
    chartType: initialState.chartType,
    visible: initialRange.visible_range,
  }));
  console.log('SNAPSHOT', JSON.stringify(snapshot));

  for (const tf of ['240', '60', '15']) {
    const changed = await call('chart_set_timeframe', { timeframe: tf });
    console.log(`TF_${tf}`, JSON.stringify(changed));
  }

  const restored = await call('chart_restore_state');
  const finalState = await call('chart_get_state');
  const finalRange = await call('chart_get_visible_range');
  console.log('RESTORE', JSON.stringify(restored));
  console.log('FINAL', JSON.stringify({
    symbol: finalState.symbol,
    resolution: finalState.resolution,
    chartType: finalState.chartType,
    visible: finalRange.visible_range,
  }));
  const stateOk = finalState.symbol === initialState.symbol
    && finalState.resolution === initialState.resolution
    && finalState.chartType === initialState.chartType;
  const rangeOk = sameRange(finalRange.visible_range, initialRange.visible_range);
  const restoredOk = restored?.success === true && stateOk && rangeOk;

  console.log('STATE_RESTORED=' + stateOk);
  console.log('RANGE_RESTORED=' + rangeOk);
  console.log('RESTORE_VERIFIED=' + restoredOk);

  if (!restoredOk) {
    process.exitCode = 1;
  }
} finally {
  await client.close();
}
