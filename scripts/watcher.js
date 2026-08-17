#!/usr/bin/env node
/**
 * Bias Watcher — monitors Consensus Dashboard on current chart, auto-creates
 * SL/TP price alerts when bias is actionable, and notifies on bias flip.
 *
 * Usage: TV_CDP_PORT=9222 node scripts/watcher.js [--once] [--interval N]
 *
 * Pipeline per tick:
 *   1. tv quote           → current symbol
 *   2. tv data tables -f "Consensus"  → dashboard rows
 *   3. Parse bias + SL/TP from rows
 *   4. If bias flipped OR symbol changed:
 *        - log + sound notify
 *        - delete old alerts (created by us)
 *        - create new SL + TP alerts (if bias in LONG/SHORT/WEAK LONG/WEAK SHORT)
 *   5. Persist state, sleep, repeat.
 *
 * State file: scripts/.watcher-state.json
 * Log file:   scripts/watcher.log
 *
 * Compatible with v3.1 (8 rows) and v3.2 (10 rows) — parses by header, not index.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(HERE, '.watcher-state.json');
const LOG_FILE   = join(HERE, 'watcher.log');
const CLI = join(HERE, '..', 'src', 'cli', 'index.js');

// Defaults (override via CLI flags)
const args = process.argv.slice(2);
const ONCE = args.includes('--once');
const intervalArg = args.indexOf('--interval');
const INTERVAL_MS = (intervalArg !== -1 && args[intervalArg + 1])
  ? Math.max(2000, Number(args[intervalArg + 1]) * 1000)
  : 15000;
const SOUND_ON_FLIP = !args.includes('--quiet');

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------
function loadState() {
  if (!existsSync(STATE_FILE)) {
    return { symbol: null, lastBias: null, lastAlertIds: [], lastPoll: 0, version: 1 };
  }
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); }
  catch { return { symbol: null, lastBias: null, lastAlertIds: [], lastPoll: 0, version: 1 }; }
}
function saveState(s) {
  writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}
function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  process.stdout.write(line);
  try { appendFileSync(LOG_FILE, line); } catch {}
}
function notify(reason) {
  // Sound cue: 2 short beeps for flip, 1 short for routine poll
  if (!SOUND_ON_FLIP) return;
  try {
    execFileSync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      '[Console]::Beep(880, 120); Start-Sleep -Milliseconds 60; [Console]::Beep(1175, 180)',
    ], { stdio: 'ignore', windowsHide: true });
  } catch { /* audio unavailable, ignore */ }
  log(`>>> NOTIFY: ${reason}`);
}

// -----------------------------------------------------------------------------
// CLI bridge
// -----------------------------------------------------------------------------
function cli(cmd, cmdArgs = [], timeoutMs = 15000) {
  const env = { ...process.env };
  if (!env.TV_CDP_PORT) env.TV_CDP_PORT = '9222';
  try {
    const out = execFileSync('node', [CLI, cmd, ...cmdArgs], {
      encoding: 'utf8',
      timeout: timeoutMs,
      env,
      cwd: join(HERE, '..'),
    });
    return JSON.parse(out);
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : '';
    const stdout = err.stdout ? err.stdout.toString() : '';
    // Try parsing stdout — some errors return JSON
    const tryParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
    const parsed = tryParse(stdout) || tryParse(stderr);
    if (parsed) return parsed;
    throw new Error(`cli ${cmd} failed: ${stderr || err.message}`);
  }
}

// -----------------------------------------------------------------------------
// Parsers (v3.1 + v3.2 compatible — header-based, not index-based)
// -----------------------------------------------------------------------------
function parseDashboard(rows) {
  // v3.2 row format: "BIAS | ⚪ NEUTRAL"
  // v3.1 row format: "BIAS | ⚪ NEUTRAL" (same)
  // v3.2 SL/TP: "SL/TP Long | 4382.85  →  4415.46 (Gold)"
  // v3.1 SL/TP: "SL/TP Long | 4382.85  →  4415.46"
  const find = (prefix) => rows.find(r => r.startsWith(prefix + ' |'));
  if (!rows || !rows.length) return null;

  const biasRow = find('BIAS');
  const slLongRow  = find('SL/TP Long');
  const slShortRow = find('SL/TP Short');
  if (!biasRow) return null;

  const biasCell = biasRow.split('|')[1].trim();
  // Strip emoji (any non-letter at start) + extract state
  const biasMatch = biasCell.match(/(LONG|SHORT|NEUTRAL)/);
  const bias = biasMatch ? biasMatch[0] : 'NEUTRAL';
  const confidenceMatch = rows.find(r => r.startsWith('Confidence |'));
  const confidence = confidenceMatch
    ? Number(confidenceMatch.split('|')[1].match(/-?\d+/)?.[0] || 0)
    : 0;

  const parsePrices = (row) => {
    if (!row) return null;
    const m = row.match(/(\d+(?:\.\d+)?)\s*→\s*(\d+(?:\.\d+)?)/);
    if (!m) return null;
    const assetMatch = row.match(/\((\w+)\)/);
    return { sl: Number(m[1]), tp: Number(m[2]), asset: assetMatch ? assetMatch[1] : null };
  };

  return {
    bias,
    confidence,
    long:  parsePrices(slLongRow),
    short: parsePrices(slShortRow),
  };
}

// -----------------------------------------------------------------------------
// Alert management
// -----------------------------------------------------------------------------
function deleteAlerts(ids) {
  if (!ids || !ids.length) return;
  for (const id of ids) {
    try {
      const r = cli('alert', ['delete', '--id', String(id)]);
      log(`  deleted alert ${id} (ok=${r.success})`);
    } catch (e) {
      log(`  delete alert ${id} failed: ${e.message}`);
    }
  }
}
function createAlert({ symbol, price, condition, message }) {
  const r = cli('alert', ['create', '-p', String(price), '-c', condition, '-m', message]);
  if (r && r.success && r.alert_id) {
    return r.alert_id;
  }
  log(`  alert create failed: ${r?.error || JSON.stringify(r)}`);
  return null;
}

// -----------------------------------------------------------------------------
// Main tick
// -----------------------------------------------------------------------------
function tick(state) {
  const t0 = Date.now();
  const quote = cli('quote');
  if (!quote.success) { log('quote failed — skipping tick'); return false; }
  const symbol = quote.symbol;

  const tables = cli('data', ['tables', '-f', 'Consensus']);
  const rows = tables?.studies?.[0]?.tables?.[0]?.rows;
  if (!rows) {
    log(`no Consensus dashboard on ${symbol} — skipping tick`);
    return false;
  }
  const dash = parseDashboard(rows);
  if (!dash) {
    log('dashboard rows unparseable — skipping tick');
    return false;
  }

  const { bias, confidence, long, short } = dash;
  const isBullish = /LONG/.test(bias);
  const isBearish = /SHORT/.test(bias);
  const isActionable = isBullish || isBearish;
  const dir = isBullish ? 'long' : isBearish ? 'short' : null;
  const changed = bias !== state.lastBias || symbol !== state.symbol;

  if (changed) {
    const prev = state.lastBias ? `${state.lastBias}@${state.symbol}` : '(none)';
    log(`BIAS FLIP on ${symbol}: ${prev} → ${bias} (conf=${confidence}%)`);
    if (state.lastAlertIds?.length) {
      log(`  cleanup: ${state.lastAlertIds.length} old alerts`);
      deleteAlerts(state.lastAlertIds);
      state.lastAlertIds = [];
    }
    if (isActionable) {
      const tgt = dir === 'long' ? long : short;
      if (tgt) {
        // LONG: SL below (less_than), TP above (greater_than)
        // SHORT: SL above (greater_than), TP below (less_than)
        const slCond = dir === 'long' ? 'less_than' : 'greater_than';
        const tpCond = dir === 'long' ? 'greater_than' : 'less_than';
        const slMsg = `${symbol} ${bias} SL @ ${tgt.sl} (${tgt.asset || '?'}) — check dashboard`;
        const tpMsg = `${symbol} ${bias} TP @ ${tgt.tp} (${tgt.asset || '?'}) — check dashboard`;
        log(`  creating SL alert @ ${tgt.sl} (${slCond})`);
        const slId = createAlert({ symbol, price: tgt.sl, condition: slCond, message: slMsg });
        log(`  creating TP alert @ ${tgt.tp} (${tpCond})`);
        const tpId = createAlert({ symbol, price: tgt.tp, condition: tpCond, message: tpMsg });
        state.lastAlertIds = [slId, tpId].filter(Boolean);
      } else {
        log(`  SL/TP rows not parseable for ${dir} — no alerts created`);
      }
    }
    state.symbol = symbol;
    state.lastBias = bias;
    notify(`${symbol}: ${prev} → ${bias}`);
  }

  state.lastPoll = Math.floor(Date.now() / 1000);
  state.lastConfidence = confidence;
  saveState(state);

  log(`tick ok [${Date.now() - t0}ms]: ${symbol} ${bias} ${confidence}%`);
  return true;
}

// -----------------------------------------------------------------------------
// Lifecycle
// -----------------------------------------------------------------------------
let running = true;
process.on('SIGINT',  () => { log('SIGINT — exiting'); running = false; });
process.on('SIGTERM', () => { log('SIGTERM — exiting'); running = false; });

mkdirSync(dirname(LOG_FILE), { recursive: true });
mkdirSync(dirname(STATE_FILE), { recursive: true });

log(`=== Bias Watcher started (interval=${INTERVAL_MS}ms, once=${ONCE}) ===`);
const state = loadState();
log(`state loaded: symbol=${state.symbol} lastBias=${state.lastBias} alerts=${state.lastAlertIds?.length || 0}`);

if (ONCE) {
  try { tick(state); } catch (e) { log(`FATAL: ${e.message}`); process.exit(1); }
  process.exit(0);
}

(async function loop() {
  while (running) {
    try { tick(state); }
    catch (e) { log(`tick error: ${e.message}`); }
    if (!running) break;
    await new Promise(r => setTimeout(r, INTERVAL_MS));
  }
  saveState(state);
  log('=== Watcher stopped ===');
  process.exit(0);
})();
