# Consensus Dashboard — Phân tích & Trạng thái (v3.2)

**File source**: `tradingview-mcp/scripts/current.pine` (v3.2, 19,598 B, 405 lines)
**Phiên bản Pine**: v6
**Trạng thái**: v3.2 ready, 0 compile errors, deploy pending manual click (MCP-MONACO disconnect)

**Backup chain**:
- `current.v1.pine` (4,140 B) — v1 baseline
- `current.v2.pine` (6,215 B) — v2 UX-improved
- `current.v3.1.pine` (11,306 B) — v3.1 (9 logic fixes)
- `current.pine` (19,598 B) — **v3.2 current** (P1-P5: drawings + OB + sweep + 3-TF + asset preset)

---

## Mục tiêu

Xây dựng dashboard tổng hợp signal (consensus) từ 9 voters SMC/ICT/Price action, hiển thị trực tiếp trên chart TradingView, MCP có thể đọc lại output qua `data_get_pine_tables`. Single symbol, scope đầu tiên.

V3.2 mở rộng v3.1: thêm chart drawings (HTF EMA, BOS lines, FVG boxes, OB boxes, killzone bg, premium/discount tint), 3 voters mới (Order Blocks, Liquidity Sweep, 3-TF Confluence + MTF standalone), và asset preset auto-default.

## Kiến trúc v3.2

```
Layer 1: Data sources (built-in Pine functions)
  ├── HTF bias (request.security D, EMA50, slope check) [symmetric]
  ├── MTF bias (auto-computed from current TF, e.g. 15m → 1h)
  ├── LTF bias (current TF, EMA 9/21/50 alignment)
  ├── Structure (BOS via ta.pivothigh/low, persistent state)
  ├── FVG (3-bar gap, ICT-style)
  ├── Absorption (vol spike + small body + long wick)
  ├── Order Blocks (last opposing candle before BOS, 10-bar lookback)
  ├── Liquidity Sweep (failed break: wick above/below swing + close back)
  ├── 3-TF Confluence (HTF + MTF + LTF alignment)
  └── Session (NY hour + London split: London 8-10, NY AM 12-15, NY PM 19-22 UTC)

Layer 2: Vote logic (9 voters)
  ├── V1 HTF, V2 LTF, V3 BOS (vol-gated), V4 FVG, V5 Absorption,
  ├── V6 Killzone (boost), V7 3-TF Confluence, V8 Liq Sweep, V9 MTF
  ├── Each: +1 (LONG) / -1 (SHORT) / 0 (NEUTRAL)
  ├── total = sum of all voter weights (max 9)
  ├── confidence = round((votes / total) * 100, 0)
  ├── absConf = |confidence|
  └── bias = absConf >= strongThresh ? (votes > 0 ? LONG : SHORT)
            : absConf >= weakThresh ? (votes > 0 ? WEAK LONG : WEAK SHORT)
            : NEUTRAL

Layer 3: Output
  ├── Chart drawings (toggleable via Drawings group)
  │   ├── HTF EMA line (plot, orange, linewidth=2)
  │   ├── BOS lines (line.new, green/red, extend right)
  │   ├── FVG boxes (box.new, green/red shaded, label "Bull/Bear FVG")
  │   ├── OB boxes (box.new, teal/maroon, label "Bull/Bear OB")
  │   ├── Sweep labels (label.new, "Sweep ↑↓/↓↑")
  │   ├── Killzone bg (bgcolor blue, 95% transparent)
  │   └── Premium/Discount bg (bgcolor red/green, 96% transparent)
  └── Table (top-right, 2 cols × 10 rows)
      ├── Row 0: BIAS (emoji + state)
      ├── Row 1: Action (with 3-TF confluence hint)
      ├── Row 2: Confidence (bar + %)
      ├── Row 3: Price / ATR
      ├── Row 4: 3-TF (HTF/MTF/LTF alignment with checkmark)
      ├── Row 5-7: Voters 1/3, 2/3, 3/3 (split for readability)
      ├── Row 8: SL/TP Long (with asset type label)
      └── Row 9: SL/TP Short (with asset type label)
```

## Pre-check 1 vòng (CEO/PM review) — v3.2

### 1. Logic đúng chưa?

**Bugs đã phát hiện và fix (across v1 → v3.2)**:

| # | Bug | Mức | Version | Fix |
|---|---|---|---|---|
| 1 | SHORT signal unreachable | 🔴 Critical | v1 | `absConf = \|confidence\|; absConf >= 60%` |
| 2 | BOS false-trigger ở bar đầu | 🔴 Critical | v1 | `not na(lastHi[1]) and close > lastHi[1]` |
| 3 | HTF asymmetric vote | 🟡 Medium | v3.0 | `htfStrongBull/htfStrongBear` symmetric with slope check |
| 4 | BOS always triggers (no vol) | 🟡 Medium | v3.0 | `volume > 1.2× avg` toggle |
| 5 | Action guidance ignores zone | 🟡 Medium | v3.0 | "Buy in discount, Sell in premium" |
| 6 | Asset preset informational only | 🟢 Low | v3.0 | Pine v6 const→series limitation |
| 7 | Pine v6 nested ternary error | 🟡 Medium | v3.2 | Refactored to `f_selectMtf()` function |

**v3.2 fixes applied** (7 above + 1 v3.2):
- Refactored MTF res nested ternary → function (fixed Pine v6 syntax error)

**Logic đúng đã verify (v3.2)**:
- BOS dùng `else if` → mutually exclusive (không +1 và -1 cùng lúc) ✅
- FVG symmetric: `low > high[2]` bull, `high < low[2]` bear ✅
- HTF request.security có `barmerge.gaps_off, barmerge.lookahead_off` → không leak forward ✅
- Pivot `lookback=1` → confirmed, không repaint về giá trị thực tế ✅
- NY session: `votes += 1; total += 1` → chỉ count khi in-session, không dilute confidence off-session ✅
- 3-TF confluence: V7 + V9 → MTF có 2 votes khi 3-TF aligned (intentional, documented) ✅
- OB loop: `for i = 1 to 10` + `if ... break` → first match wins, no overflow ✅
- Liq sweep: failed break pattern + reversal follow-through → conservative but correct ✅
- Asset preset switch: `=> slInp` fallback cho "Custom" → safe ✅
- Killzone bg + Premium/Discount bg mutually exclusive (Premium/Discount skipped during KZ) ✅

### 2. Workflow ổn chưa?

**Deploy workflow v3.2** (verified):
```
scripts/current.pine (file local, 405 lines)
  → ui_open_panel pine-editor open
  → TV_CDP_PORT=9222 node scripts/pine_push.js
    → Inject 405 lines to Monaco
    → Click "Pine Save" button (compile)
    → Verify 0 errors via getModelMarkers()
  → click "Add to chart" / "Update on chart" button (MANUAL)
  → node src/cli/index.js state (verify study name)
  → node src/cli/index.js data tables (read table output)
  → node src/cli/index.js screenshot (visual confirm)
```

**Issues & improvements**:
- `pine_push.js` đã edit để read `TV_CDP_PORT` env var (was hard-coded 9333) ✅
- Pine Editor multiple tabs: `pine new` tạo Untitled tab. Cẩn thận target đúng tab. ✅ Documented.
- "Publish script" button = community publish, không phải cloud save. KHÔNG click nếu private. ✅ Documented.
- Manual "Add to chart" vẫn cần (MCP-MONACO disconnect known). ✅ Documented.

**Test plan** (chạy sau khi user click Add to chart):
1. Switch chart OILWTIUSDT.P 15m, xác nhận dashboard v3.2 render
2. Screenshot visual check (HTF EMA + BOS + FVG + OB + Sweep + KZ bg + Premium/Discount tint)
3. `data tables` returns 10 rows matching v3.2 spec
4. Toggle drawings off → confirm disappear, table unchanged
5. Switch asset dropdown Gold → BTC → Forex → confirm SL/TP rows update
6. Check 3-TF row: H:↑↑ M:↑ L:↑ ✓ (all aligned)

### 3. Thiếu tính năng gì?

**Đã có trong v3.2** (all 5 priorities):
- ✅ P1 Chart drawings: HTF EMA line, BOS lines, FVG boxes, killzone bg, premium/discount tint
- ✅ P2 Order Blocks: last opposing candle before BOS
- ✅ P3 Liquidity sweep: failed break pattern
- ✅ P4 3-TF confluence: HTF + MTF + LTF alignment
- ✅ P5 Asset preset auto-default: switch on assetType

**Còn thiếu (out of scope v3.2)**:
- ❌ **P6 Alerts integration**: workflow ngoài Pine, cần MCP `alert_create` + bias watcher
- ❌ **OB retest as voter**: price quay về OB zone = confirmation
- ❌ **Multi-symbol scan**: N/A for Pine
- ❌ **Position sizing**: out of scope
- ❌ **News filter**: external data source
- ❌ **Dynamic vote weighting**: currently equal-weight, Phase 2

**v3.3 candidates** (next session):
1. ~~OB retest as V10 voter~~ → ✅ DONE session 6
2. ~~Bias change alerts via MCP~~ → ✅ DONE session 5 (watcher.js)
3. ~~Confidence threshold for "no signal" filter~~ → ✅ DONE session 6 (NO SIGNAL state)
4. ~~Backtest mode (BOS accuracy in last N bars)~~ → ✅ DONE session 6 (BOS Acc stat)
5. Multi-timeframe BOS (HTF BOS as V3.5 voter) — defer to v3.4

### 4. Rủi ro tiềm ẩn

| Rủi ro | Mức | Mitigation | Status |
|---|---|---|---|
| Repaint khi reload chart | Thấp | Pivot lookback=1 (confirmed) | ✅ Mitigated |
| request.security lookahead | Đã fix | Explicit `barmerge.lookahead_off` | ✅ Verified |
| Vote equal-weight | TB | MVP chấp nhận; Phase 2 thêm weight | ⏸ Pending |
| Pine Editor không accessible qua MCP trên acc mới | High (blocker) | `pine_push.js` workaround + manual click | ⚠️ Partially mitigated |
| VolAvg thấp cho crypto low-cap | TB | Vol spike threshold 1.5× | ⏸ Acceptable |
| ATR quá tight trong low volatility | TB | User adjust `atrLen` | ✅ User controllable |
| HTF "D" có thể không hợp với intraday trader | Thấp | Configurable qua input `htfRes` | ✅ User controllable |
| Memory growth (drawings never deleted) | Thấp | `max_*_count=500` auto-prune | ✅ Pine v6 default |
| Performance (9 voters + drawings) | TB | Test on slow chart in v3.3 | ⏸ Real-world test pending |
| OB no-op at first bars | Rất thấp | Loop with break, safe | ✅ Verified |
| Liq sweep conservative (miss some) | By design | Filter "trap + reversal follow-through" | ✅ Documented |
| MTF res missing for some TFs | Thấp | Default to D for unmapped | ✅ Safe fallback |
| Pine v6 const→series (asset preset) | Worked around | Switch on string at runtime | ✅ Documented |

## Verification (deploy plan)

1. **Compile**: 0 errors từ `pine check` ✅
2. **Compile (live)**: 0 errors từ `pine_push.js` ✅
3. **Visual**: Screenshot cho thấy table top-right 10 rows (after manual deploy)
4. **Read-back**: `data_get_pine_tables` returns 10 rows matching v3.2 spec
5. **Logic test** (after deploy):
   - Bar với all bull signals → BIAS=LONG, confidence=+100%
   - Bar với all bear signals → BIAS=SHORT, confidence=-100%
   - Bar với split signals → BIAS=NEUTRAL, confidence ~0
6. **Edge case**: First bars (HTF chưa có data) → BIAS=NEUTRAL

---

## Alerts Workflow (P3, session 5)

**File**: `tradingview-mcp/scripts/watcher.js` (9,895 B, end-to-end tested)
**Docs**: `docs/WATCHER.md` (full pre-check + usage)

### What it does

Watches the current chart's Consensus Dashboard bias. When bias flips to actionable (LONG/SHORT/WEAK LONG/WEAK SHORT), automatically creates SL + TP price alerts via `alert_create`. When bias flips back to NEUTRAL (or chart switches), deletes the old alerts it created (does NOT touch user's manual alerts).

### Pipeline

```
every 15s (configurable):
  1. read current symbol + dashboard rows
  2. parse bias (works for v3.1 8 rows + v3.2 10 rows — header-based)
  3. if (bias changed) OR (symbol changed):
       - delete state.lastAlertIds (only watcher-created)
       - if (actionable bias): create SL alert + TP alert at dashboard levels
       - notify (PowerShell beep + log)
  4. save state
```

### Usage

```bash
# Loop (default 15s)
TV_CDP_PORT=9222 node scripts/watcher.js

# One-shot
TV_CDP_PORT=9222 node scripts/watcher.js --once

# Custom interval + silent
TV_CDP_PORT=9222 node scripts/watcher.js --interval 30 --quiet
```

### Verified end-to-end (5 scenarios)

| # | Action | Result |
|---|---|---|
| 1 | First run on GOLD (NEUTRAL) | Logged, 0 alerts, sound notify |
| 2 | Switch to OIL (LONG), re-run | Created 2 alerts (SL 81.4 less + TP 83 greater) |
| 3 | Re-run, no change | No new alerts, fast tick (684ms) |
| 4 | Loop mode 3 ticks | Stable, no errors |
| 5 | Switch to GOLD (NEUTRAL) | Deleted 2 OIL alerts, no new (count=2 ACEUSDT only) |

### What it doesn't do (defer v2)

- External notification (Telegram, email, Windows toast) — only sound + log
- Debounce (rapid bias flips = alert spam)
- Multi-chart monitor (single chart only)
- Heartbeat warning if TV disconnects

---

## v3.3 (session 6) — OB Retest V10 + NO SIGNAL + BOS Accuracy

**File**: `tradingview-mcp/scripts/current.pine` (v3.3, 22,361 B, 460 lines after Round 2 fix)
**Backup**: `tradingview-mcp/scripts/current.v3.2.pine` (v3.2, 19,370 B, 400 lines)
**Docs**: `docs/V3_3_PRE_CHECK.md` (14,249 B, with Round 2 section)

### 3 features added (vs v3.2)

1. **P4 — OB Retest as V10 voter**
   - Tracks latest bull/bear OB zones (top + bottom) on each BOS event
   - V10 vote: `+1` when price dips into bull OB zone and closes above bottom, `-1` for bear OB zone
   - OB tracking runs ALWAYS (independent of `showOB` drawing toggle — Round 2 fix)
   - New table cell in Voters 3/3 row: `OB:↑/↓/·`

2. **P5 — NO SIGNAL state**
   - New input `noSigThresh` (default 30) in Bias Settings group
   - New bias state: when `|confidence| < noSigThresh`, bias = "NO SIGNAL"
   - Visual: ⚫ emoji + "🚫 No signal — confidence too low" action
   - Background: gray (Round 2 fix — was black, invisible on dark theme)

3. **P6 — BOS Accuracy stat**
   - New input group "Backtest Stats" with `bosAccLookback` (default 50) + `bosAccWinBars` (default 10)
   - Loop back N bars, count BOS events where current close is in BOS direction from BOS bar's close
   - Display: table row 10 "BOS Acc: W/T (P%)" with green if >= 50%, red if < 50%
   - "—" if no BOS in lookback

### v3.3 table layout (11 rows × 2 cols)

```
Row 0:  BIAS          (5 states: LONG/SHORT/WEAK LONG/WEAK SHORT/NO SIGNAL/NEUTRAL)
Row 1:  Action        (with zone + confluence hints)
Row 2:  Confidence    (bar + %)
Row 3:  Price / ATR
Row 4:  3-TF          (HTF/MTF/LTF alignment)
Row 5:  Voters 1/3    (HTF, LTF, BOS)
Row 6:  Voters 2/3    (FVG, Abs, Sweep)
Row 7:  Voters 3/3    (MTF, KZ, Cnfl, OB)  ← V10 added
Row 8:  SL/TP Long
Row 9:  SL/TP Short
Row 10: BOS Acc       ← NEW (P6)
```

### Watcher integration (session 5 watcher + v3.3)

Watcher filters bias via `bias.includes('LONG'/'SHORT')`:
- LONG, WEAK LONG, SHORT, WEAK SHORT → actionable (create SL + TP alerts)
- NEUTRAL, NO SIGNAL → not actionable (no alerts, cleanup old ones)

**NO SIGNAL state is correctly skipped** by watcher (no LONG/SHORT substring). No watcher update needed.

### v3.3 → v3.2 rollback

If user prefers v3.2:
1. `cp scripts/current.v3.2.pine scripts/current.pine`
2. `TV_CDP_PORT=9222 node scripts/pine_push.js` (push v3.2 source)
3. User click "Update on chart" in Pine Editor

---

## File locations (v3.3 + watcher)

| File | Purpose | Size | Status |
|---|---|---|---|
| `tradingview-mcp/scripts/current.pine` | v3.3 source | 22,361 B (460 lines) | ✅ Ready |
| `tradingview-mcp/scripts/current.v3.2.pine` | v3.2 backup (rollback) | 19,370 B (400 lines) | ✅ NEW session 6 |
| `tradingview-mcp/scripts/current.v3.1.pine` | v3.1 backup | 11,306 B (244 lines) | ✅ |
| `tradingview-mcp/scripts/current.v2.pine` | v2 backup | 6,215 B | ✅ |
| `tradingview-mcp/scripts/current.v1.pine` | v1 backup | 4,140 B | ✅ |
| `tradingview-mcp/scripts/pine_push.js` | Push + compile helper (port 9222) | 3,755 B | ✅ Updated (env var) |
| `tradingview-mcp/scripts/watcher.js` | Bias watcher (P3, session 5) | 9,895 B | ✅ |
| `tradingview-mcp/scripts/.watcher-state.json` | Watcher persistent state | ~150 B | ✅ Created on run |
| `tradingview-mcp/scripts/watcher.log` | Watcher append-only log | grows | ✅ |
| `docs/V3_2_PRE_CHECK.md` | v3.2 pre-check analysis | 16,000+ B | ✅ |
| `docs/V3_3_PRE_CHECK.md` | v3.3 pre-check analysis (with Round 2) | 14,249 B | ✅ NEW session 6 |
| `docs/WATCHER.md` | Watcher pre-check + usage | 9,580 B | ✅ NEW session 5 |
| `docs/SESSION_6_HANDOVER.md` | Session 6 work log | 10,566 B | ✅ NEW session 6 |
| `docs/CONTEXT.md` | Persistent session state | TBD | ✅ Updated session 6 |
| `docs/SESSION_4_HANDOVER.md` | Session 4 handover | 9,957 B | ✅ |
| `docs/CONSENSUS_DASHBOARD.md` | This file (v3.2 + v3.3 + watcher) | — | ✅ |
