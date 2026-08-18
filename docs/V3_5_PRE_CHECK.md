# Consensus Dashboard v3.5 — Pre-check Analysis (CEO/PM Review)

**Date**: 2026-08-18
**Session**: 8 (continuation)
**File**: `tradingview-mcp/scripts/current.pine` (v3.5, 25,997 B, 514 lines)
**Backup**: `tradingview-mcp/scripts/current.v3.5.pine` (identical to current)
**Author**: Mavis (mavis)
**Trigger**: Priority 8 backlog — "Hide all drawings" master switch (1 input, 0 logic change)

---

## Mục tiêu v3.5

Add 1 master switch (`hideAllDrawings`) để trader tắt TẤT CẢ 5 chart drawings (HTF EMA + BOS + FVG + OB + Sweep) khi chỉ muốn xem 11-row table. KZ background tint + Premium/Discount tint **KHÔNG** bị ảnh hưởng (giữ context background).

**Khác với 4 individual toggles (showHTF/showBOS/showFVG/showOB/showSweep)**:
- Individual: bật/tắt từng loại
- Master: tắt tất cả 5 cùng lúc (overrides individual)

Voting logic 100% không thay đổi.

---

## Tóm tắt nhanh

| Item | Status | Note |
|---|---|---|
| Voting logic change | ❌ NONE | 100% v3.4 logic preserved |
| New inputs added | 1 | `hideAllDrawings` (default=false) |
| Modified inputs | 5 | `showHTF`, `showBOS`, `showFVG`, `showOB`, `showSweep` got `and not hideAllDrawings` |
| Total inputs | 21 → 22 | Group `Drawings` |
| Compile (server-side) | ✅ 0 errors | `tv pine check -f current.pine` |
| Static analyze | ✅ 0 issues | `tv pine analyze -f current.pine` |
| Push to Pine Editor | ✅ 514 lines | `tv pine set` (Monaco view updated) |
| Compile in editor | ✅ 0 errors | `tv pine compile` |
| Auto-deploy to chart | ❌ BLOCKED | Same Monaco dirty-state bug (session 7 known limitation) |
| Manual save required | ⚠️ 30 sec | User must: type char → Save → Update on chart |

---

## Pre-check (CEO/PM view, single pass — change is small)

### 1. Logic đúng chưa?

**Change scope** (delta from v3.4 → v3.5): 7 lines total. Logic untouched.

```pine
// NEW (line 32): master switch
hideAllDrawings = input.bool(false, "Hide all drawings (master switch)", group=grpDraw, tooltip="...")

// MODIFIED (5 lines): 5 individual toggles
showHTF    = input.bool(true, "Show HTF EMA line", group=grpDraw) and not hideAllDrawings
showBOS    = input.bool(true, "Show BOS lines", group=grpDraw) and not hideAllDrawings
showFVG    = input.bool(true, "Show FVG boxes", group=grpDraw) and not hideAllDrawings
showOB     = input.bool(true, "Show Order Blocks", group=grpDraw) and not hideAllDrawings
showSweep  = input.bool(true, "Show Liquidity Sweep labels", group=grpDraw) and not hideAllDrawings
```

**Why this works**:
- `and not hideAllDrawings` evaluates AFTER the input.bool returns user's value
- If `hideAllDrawings = true`, all 5 show* become `false` → drawing code in `if showX` blocks skip
- If `hideAllDrawings = false`, all 5 show* = user's individual choice
- KZ and PDisc NOT modified — they stay independent (background context)
- Table NOT modified — still shows regardless of drawings state

**v3.4 logic preserved (verified)**:
- 11-row table: unchanged
- 10 voters: unchanged
- P5 NO SIGNAL: unchanged
- P6 BOS Acc: unchanged
- Cap logic (5/3/5/3): unchanged
- All other groups (HTF settings, asset, MTF, risk): unchanged

### 2. Workflow ổn chứ?

- **Same as v3.4**: Pine Editor Save button broken via API
- User flow to deploy v3.5 to chart: 30 sec
  1. Open Pine Editor
  2. Click in editor area
  3. Type any char (e.g., space)
  4. Click "Save" button (now enabled)
  5. Click "Update on chart" or "Add to chart"
- No new dependency, no new env var
- TV_CDP_PORT=9222 already in .env.local (session 8 task 3)

### 3. Thiếu tính năng gì?

Nothing. v3.5 is exactly what Priority 8 backlog asked for. Deferred items still in Priority 8:
- "Fade by age" for older OBs (color fade based on bar distance)
- "Consolidate mode" (merge adjacent OBs of same side)
- Auto-remove BOS line on structure reverse
- OB retest V11: distance-based weighting

These are separate features, not v3.5 scope.

### 4. Rủi ro tiềm ẩn

**R1**: User sets `hideAllDrawings = true` and forgets → chart looks empty, thinks indicator is broken
- **Mitigation**: Tooltip on input explains: "Useful for clean chart when only the table is needed"
- **Status**: Acceptable. User can easily toggle off.

**R2**: Master switch conflicts with individual toggles UX
- **Scenario**: User sets `hideAllDrawings = true`, then toggles `showOB = true` in settings — chart still doesn't show OB
- **Mitigation**: Tooltip on `hideAllDrawings`: "Override all 5 individual drawing toggles below"
- **Status**: Acceptable. Master switch wins by design.

**R3**: KZ/PDisc tints also clutter chart when "Hide all drawings" is on
- **Mitigation**: User can manually toggle `showKZ`/`showPDisc` to false if needed
- **Status**: Acceptable. Most users want KZ visible for time-of-day context.

---

## Migration impact

- **v3.4 → v3.5**: 1 new input + 5 modified lines, no logic change
- **Backwards compat**: Charts with v3.4 deployed will show new input but default `hideAllDrawings = false` → no visible change unless user enables
- **Rollback**: Copy `current.v3.4.pine` → `current.pine`, manual save to update chart

---

## Session 8 deliverables (this round)

| Deliverable | Status |
|---|---|
| `tradingview-mcp/scripts/current.pine` v3.5 (25,997 B, 514 lines) | ✅ |
| `tradingview-mcp/scripts/current.v3.5.pine` backup | ✅ |
| `docs/V3_5_PRE_CHECK.md` (this file) | ✅ |
| Compile clean (server + Monaco) | ✅ 0 errors |
| Static analyze clean | ✅ 0 issues |
| Pushed to Pine Editor | ✅ Monaco updated (library still v3.4 — manual save required) |
| `src/connection.js` env-loader for `.env.local` | ✅ (task 3) |
| `src/cli/index.js` env-loader removed (moved to connection.js) | ✅ |
| `.env.example` TV_CDP_PORT=9222 documented | ✅ (task 3) |

---

## Lessons cho next session

1. **ESM import hoisting gotcha**: `import` statements are hoisted to top of module. If you need side effects (like `process.loadEnvFile`) before other imports, put them in a module that's imported FIRST by the consumer (not in the entry point itself). For `connection.js`, env loading goes at the top of the module (no issue with hoisting there since it IS the first thing connection.js does).

2. **Pine Editor Save button bug persists**: Manual save required. Don't waste tokens on more workarounds — just document the 30-sec user flow.

3. **`tv pine analyze` is offline (no TV needed)** — perfect for CI. Detects basic issues (syntax, undefined vars). For deeper checks (var declare-before-use, type compat), write custom static checker.

4. **`tv pine check` is server-side** — also no TV needed. Uses TradingView's REST API to compile. Good CI fallback.

5. **v3.5 is intentionally minimal** — 1 input, 5 line mods. Resist feature creep in small releases. Save multi-feature work for v3.6+.
