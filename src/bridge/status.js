/**
 * Bridge operational diagnostics and status checking.
 */
import { CDP_HOST, CDP_PORT } from '../connection.js';

export async function probeLocalCdp(host = CDP_HOST, port = CDP_PORT, timeoutMs = 2000) {
  const url = `http://${host}:${port}/json/version`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (resp.ok) {
      const data = await resp.json();
      return { online: true, version: data };
    }
    return { online: false, error: `HTTP ${resp.status}` };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

export async function checkBridgeStatus(options = {}) {
  const host = options.host || CDP_HOST;
  const port = options.port || CDP_PORT;

  const cdpCheck = await probeLocalCdp(host, port, options.timeoutMs);

  return {
    success: true,
    bridge_target: `VPS 127.0.0.1:${port} -> PC 127.0.0.1:${port}`,
    local_cdp_host: host,
    local_cdp_port: port,
    local_cdp_online: cdpCheck.online,
    local_cdp_info: cdpCheck.online ? {
      browser: cdpCheck.version?.Browser,
      userAgent: cdpCheck.version?.['User-Agent'],
    } : null,
    status_summary: cdpCheck.online
      ? 'TradingView Desktop is running with CDP enabled on port ' + port
      : 'TradingView Desktop is not running or CDP is offline on port ' + port + ' (waiting for user to open TradingView manually)',
  };
}
