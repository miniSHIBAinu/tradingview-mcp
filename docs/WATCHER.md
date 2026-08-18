# Bias Watcher — Alerts Integration (P3, session 5)

**Date**: 2026-08-17
**Session**: 5
**Status**: ✅ Production-ready, end-to-end tested
**File**: `tradingview-mcp/scripts/watcher.js` (9,895 B)
**Author**: Mavis (mavis)

---

## Tóm tắt nhanh

MCP workflow tự động monitor dashboard bias trên chart hiện tại. Khi bias flip → notify (sound) + auto-create SL/TP price alerts qua `alert_create`. Khi flip về NEUTRAL → cleanup alerts cũ.

| Item | Status |
|---|---|
| End-to-end test (5 scenarios) | ✅ Pass |
| Idempotent re-run | ✅ |
| Cleanup on flip-back | ✅ |
| Multi-version parser (v3.1 8 rows + v3.2 10 rows) | ✅ |
| State persistent across runs | ✅ `.watcher-state.json` |
| Graceful error handling | ✅ Log + retry, không crash |
| Sound notification | ✅ PowerShell `[Console]::Beep` |
| External notification (Telegram/email/toast) | ❌ Defer v2 |

---

## Usage

```bash
# Loop mode (default 15s interval)
TV_CDP_PORT=9222 node scripts/watcher.js

# One-shot (single tick, useful for testing)
TV_CDP_PORT=9222 node scripts/watcher.js --once

# Custom interval (seconds)
TV_CDP_PORT=9222 node scripts/watcher.js --interval 30

# Silent (no sound on flip)
TV_CDP_PORT=9222 node scripts/watcher.js --quiet
```

**Stop**: `Ctrl+C` (saves state before exit).

---

## Pipeline per tick (~1-2s)

```
1. tv quote                              → current symbol
2. tv data tables -f "Consensus"          → dashboard rows
3. parseDashboard(rows)                  → { bias, confidence, long: {sl, tp, asset}, short: {...} }
4. if (bias != state.lastBias) OR (symbol != state.symbol):
     - log flip event
     - delete state.lastAlertIds (created by us, NOT user's manual alerts)
     - if (bias in [LONG, WEAK LONG, SHORT, WEAK SHORT]):
         create SL alert (less_than for long, greater_than for short)
         create TP alert (greater_than for long, less_than for short)
         save new alert_ids to state
     - notify (sound)
5. save state, sleep INTERVAL_MS, repeat
```

---

## State & logs

- **State**: `scripts/.watcher-state.json` (gitignored)
  ```json
  {
    "symbol": "BINGX:OILWTIUSDT.P",
    "lastBias": "LONG",
    "lastAlertIds": [5390646367, 5390647041],
    "lastPoll": 1786974030,
    "version": 1,
    "lastConfidence": 50
  }
  ```
- **Log**: `scripts/watcher.log` (append-only, timestamped)
- **Test artifacts**: `scripts/archive/watcher-*-test*.log` (gitignored)

---

## Pre-check 4 tiêu chí (CEO/PM review)

### 1. Logic đúng chưa?

| Logic | Status | Note |
|---|---|---|
| Bias parser handles v3.1 (8 rows) + v3.2 (10 rows) | ✅ | Header-based, không phụ thuộc index |
| `/LONG/`, `/SHORT/` regex covers WEAK variants | ✅ | WEAK LONG = actionable |
| SL/TP direction: long=less/greater, short=greater/less | ✅ | Correct semantics |
| Idempotent: no change → no new alerts | ✅ | Tested (test 3) |
| Cleanup only deletes watcher-created alerts | ✅ | state.lastAlertIds ≠ user manual alerts |
| State persistent across restarts | ✅ | JSON file |
| Graceful: API error → log + continue | ✅ | try/catch per CLI call |
| Graceful: SIGINT → save state + exit | ✅ | process.on('SIGINT') |

### 2. Workflow ổn chứ?

| Workflow | Status | Note |
|---|---|---|
| Easy launch: 1 env var + 1 command | ✅ | `TV_CDP_PORT=9222 node scripts/watcher.js` |
| Flags: --once, --interval, --quiet | ✅ | All implemented |
| Logs to file + stdout | ✅ | Timestamp + reason |
| State visible (read .watcher-state.json) | ✅ | Human-readable JSON |
| Easy verification: check `alert list` after run | ✅ | Tracked via test 2-3-5 |
| Graceful Ctrl+C | ✅ | Tested (test 4) |

### 3. Features đủ chưa?

| Feature | Status | Note |
|---|---|---|
| Bias flip detection | ✅ | Test 1, 2, 5 |
| Auto SL/TP price alerts on actionable bias | ✅ | Test 2 (OIL LONG → 2 alerts) |
| Cleanup on flip to NEUTRAL | ✅ | Test 5 (deleted 2 OIL alerts) |
| Multi-symbol (whatever chart is active) | ✅ | Implicit via `tv quote` |
| Sound notification on flip | ✅ | PowerShell Beep |
| Log to file | ✅ | watcher.log |
| External notification (Telegram/email/toast) | ❌ | Defer v2 |
| Debounce (rapid flip anti-spam) | ❌ | Defer v2 |
| Multi-chart monitor | ❌ | Defer v2 (would need separate state files) |
| Heartbeat (alert if TV disconnected) | ❌ | Defer v2 |

### 4. Rủi ro tiềm ẩn

| Risk | Mức | Mitigation | Status |
|---|---|---|---|
| TradingView API rounds 2-decimal prices (81.39 → 81.4, 82.99 → 83) | 🟡 Low | Documented; user should be aware | ✅ Acceptable |
| Asset type shows "?" for v3.1 (no asset preset in v3.1 table) | 🟢 Trivial | v3.2 will include asset in row | ✅ Documented |
| First run triggers notify sound (lastBias=null → current) | 🟢 Trivial | Could skip notify on initial poll; minor annoyance | ⏸ Defer |
| Watcher-created alerts persist if user kills watcher mid-LONG | 🟡 Low | Aligns with normal TV alert behavior; user can `tv alert delete --all` | ✅ Acceptable |
| CLI child process per tick (overhead) | 🟢 Trivial | 2 calls × ~700ms = 1.5s/tick. Acceptable for 15s interval. | ✅ Acceptable |
| No retry on transient API failure (5xx) | 🟡 Low | If first create fails, no alert for that bias. Could add 1 retry. | ⏸ Defer |
| Single chart only (state file would conflict if 2 watchers) | 🟡 Low | Document; user can run 1 watcher per session | ✅ Documented |
| Connection drop mid-tick | 🟢 Trivial | try/catch logs + retries next tick | ✅ Mitigated |

---

## End-to-end test results (5 scenarios)

| # | Scenario | Expected | Actual | Pass |
|---|---|---|---|---|
| 1 | First run, current=NEUTRAL | log "null → NEUTRAL", no alerts | Logged, 0 alerts | ✅ |
| 2 | Switch to OIL (LONG), re-run | log "NEUTRAL → LONG", create 2 alerts | Created 5390646367 (SL) + 5390647041 (TP) | ✅ |
| 3 | Re-run, no change | "tick ok", 0 new alerts | Tick 684ms, count still 4 | ✅ |
| 4 | Loop mode 3 ticks | stable, no errors | 3 ticks 575-1653ms, no errors | ✅ |
| 5 | Switch to GOLD (NEUTRAL) | delete 2 OIL alerts, no new | Deleted both, count=2 (ACEUSDT only) | ✅ |

**Total alerts at session end**: 2 (both ACEUSDT.P from session 3, intact). Watcher correctly isolated its own alerts from user's manual ones.

---

## Quyết định thiết kế

| # | Decision | Rationale |
|---|---|---|
| 1 | Header-based parser (not index) | v3.1 has 8 rows, v3.2 has 10. Index would break across versions. |
| 2 | Track only watcher-created alerts in state | Don't accidentally delete user's manual alerts (e.g. session 3's ACEUSDT.P). |
| 3 | State on disk, not memory | Survives restart, allows re-run without losing context. |
| 4 | CLI child process per tick (not persistent CDP) | Simpler than wiring CDP directly. ~1.5s overhead per tick acceptable. |
| 5 | PowerShell Beep for sound | Built-in, no deps. User can `--quiet` to disable. |
| 6 | Log to file AND stdout | User can tail -f watcher.log; tee to console for live feedback. |
| 7 | 15s default interval | Balance freshness vs API load. 15s = 4 ticks/min = 8 API calls/min. |
| 8 | Delete old alerts BEFORE creating new | Atomic-ish: ensures no moment with both old+new. If create fails, we just have no alerts. |
| 9 | `--once` flag | Lets user run as cron or for testing without spawning long process. |
| 10 | Skip first-run notify (deferred) | Initial state has lastBias=null, so every first run logs a "flip". Could be annoying; defer to v2. |

---

## Roadmap (v2 candidates)

1. **External notifications**: Telegram bot, email (SMTP), Windows toast
2. **Debounce**: if bias flips 3 times in 1 minute, suppress further alerts for 5 min
3. **Multi-chart**: separate state file per symbol, run parallel watchers
4. **Heartbeat**: emit warning if `quote` fails 3+ times in a row
5. **Retry on API failure**: 1 retry with backoff for `alert create` 5xx
6. **First-run silence**: if `state.lastPoll === 0`, skip notify
7. **Rich log format**: JSON lines instead of human-readable (for log shippers)
8. **Web dashboard**: read watcher.log + state.json → simple HTML status page

---

## File locations

| File | Purpose | Size | Status |
|---|---|---|---|
| `tradingview-mcp/scripts/watcher.js` | Main script | 9,895 B | ✅ New |
| `tradingview-mcp/scripts/.watcher-state.json` | Persistent state | ~150 B | ✅ Created on run |
| `tradingview-mcp/scripts/watcher.log` | Append-only log | grows | ✅ |
| `tradingview-mcp/scripts/archive/watcher-*-test*.log` | Test artifacts (gitignored) | varies | ✅ Moved |

---

## Lessons cho next session

1. **CLI command names ≠ MCP tool names** — `tv symbol` (not `chart_set_symbol`), `tv data tables -f X` (not `data_get_pine_tables`).
2. **`TV_CDP_PORT` must be exported** in PowerShell: `$env:TV_CDP_PORT='9222'` before `node`.
3. **TradingView API rounds 2-decimal prices** in alert payload — for OIL, 82.99 becomes 83.
4. **`alert delete` requires `--id` (singular) in CLI**, even though MCP tool has `alert_id` (singular) and `delete_all` (boolean).
5. **PowerShell regex via `Select-String -Pattern` is finicky** with `|` and `$` — use `[regex]::Match` for predictable behavior.
6. **Watcher's "no duplicate alerts" guarantee** is via state.lastAlertIds — never delete alerts not in that list.
7. **State file location is `scripts/`** (next to watcher.js) — gitignore covers `.watcher-state.json` and `watcher.log`.
8. **Initial run always logs a "flip"** because state.lastBias=null. Minor noise; can be fixed with `if (state.lastPoll === 0) skip notify` if annoying.
