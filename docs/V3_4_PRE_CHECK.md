# Consensus Dashboard v3.4 — Pre-check Analysis (CEO/PM Review)

**Date**: 2026-08-18
**Session**: 7 (initial) + 8 (multi-symbol validation)
**File**: `tradingview-mcp/scripts/current.pine` (v3.4, 25,449 B, 512 lines)
**Backup**: `tradingview-mcp/scripts/current.v3.4.pine` (identical to current)
**Author**: Mavis (mavis)
**Trigger**: User feedback "add chart nhìn như bãi rác vậy" (chart looks like junkyard)

---

## Mục tiêu v3.4

**Visual cleanup only — KHÔNG thay đổi voting logic.** Giải quyết chart bị overload bởi quá nhiều drawings (OB/FVG/BOS/Sweep) chồng lên nhau, dùng 2 cơ chế:

1. **Bỏ `extend=extend.right`** cho OB/FVG boxes (nguồn gốc chính của stacking) — finite window thay thế
2. **Cap số drawings** qua 4 user-tunable inputs — mỗi "side" (bull/bear) giữ tối đa N cái, cũ cũ bị `box.delete()` khi vượt cap

BOS lines **giữ** `extend=extend.right` (level vẫn hữu ích cho trader thấy structure), chỉ cap số lượng.

---

## Tóm tắt nhanh

| Item | Status | Note |
|---|---|---|
| Voting logic change | ❌ NONE | 100% v3.3 logic preserved (line-by-line verified) |
| 4 maxVis inputs added | ✅ Done | `maxVisOB=5`, `maxVisFVG=3`, `maxVisBOS=5`, `maxVisSweep=3` (per-side) |
| 8 cap-tracking arrays | ✅ Done | bullOBBoxes, bearOBBoxes, bullFVGBoxes, bearFVGBoxes, bosUpLines, bosDnLines, sweepBullLbls, sweepBearLbls |
| OB/FVG `extend.right` removed | ✅ Done | Replace with finite window (OB=20 bars, FVG=5 bars) |
| Cap logic | ✅ Done | `array.push` newest + `if size > maxVis: array.shift + box.delete` oldest |
| Compile (server-side check) | ✅ 0 errors | `tv pine check -f current.pine` |
| Compile (live TV Monaco) | ✅ 0 errors | Editor markers clean |
| Auto-deploy to chart | ❌ BLOCKED | TradingView's Monaco dirty-state bug — manual Save + Add to chart required |
| 3 pre-check passes | ✅ Done | Each pass deeper than previous, found 3 different bug classes |
| Multi-symbol validation | ✅ Done (session 8) | 4 symbols: OIL 15m, GOLD 1h, GIGGLE 1h, ACE 15m — all cap logic working at max |
| GitHub push | ✅ Done (session 7) | `miniSHIBAinu/tradingview-mcp` @ `chore/tdv-vps-foundation` (commits 205d3f5 + a747961) |

---

## Pre-check — 3 passes (CEO/PM view, deepening scope each round)

User-style workflow: write → initial pre-check → user finds something → fix → re-check → user finds more → repeat. Session 7 went 3 rounds.

### Pass 1 — Initial CEO pre-check

Focus: logic correctness, missing features, version inconsistencies.

| Bug | Fix |
|---|---|
| Line 2: `indicator("Consensus Dashboard v3.3", ...)` | Changed to `"v3.4"` |

**Lesson**: When bumping version, search for ALL string mentions of old version, not just the changelog.

### Pass 2 — After user feedback

User: "có cái gì đó vẫn lủng củng — kiểm tra dead code đi"

Focus: dead variables, unused inputs, orphan references.

| Bug | Fix |
|---|---|
| `bosAccWinBars` input declared but never used (v3.3 leftover) | Removed input + added comment explaining why removed |

**Lesson**: When porting logic forward, audit inputs/variables from previous version. v3.2 → v3.3 may have added/removed inputs that v3.4 inherited.

### Pass 3 — After user caught REAL compile error

User: "compile error CE10272 ở line 221 — undeclared identifier `bosUpLines`"

Focus: forward-references, declaration order, scope issues.

| Bug | Fix |
|---|---|
| 8 array `var x[] = array.new<...>(0)` declared in OB section (line 221) BUT BOS code (line 157) references `bosUpLines` first | Moved all 8 array declarations to top of script (line 50-57, after inputs, before any drawing code) |

**CRITICAL LESSON — Pine v6 "declare before use" enforcement**:
- All `var` declarations MUST come before first reference
- Forward-reference → `CE10272 undeclared identifier` (compile error)
- Pine v5 was more lenient; v6 strictly enforces declaration order
- **Pattern fix**: Move all `var` arrays to top of script, after inputs, before any drawing code that uses them

**Why I missed this in Pass 1/2**: I focused on logic correctness, not declaration order. The arrays are declared AND used in different sections (OB section declares them, BOS section uses them). Logical but illegal in Pine v6.

### After-fix state

| Check | Result |
|---|---|
| Compile (server-side) | ✅ 0 errors |
| Compile (Monaco editor markers) | ✅ 0 errors |
| Auto-deploy to chart | ❌ BLOCKED (TradingView bug) |
| Chart rendering | ✅ Verified SNDK 15m clean (session 7) + 4 symbols validated (session 8) |
| Voting logic | ✅ Identical to v3.3 (line-by-line) |
| Cap logic | ✅ All 4 inputs respected (5+5 OB, 3+3 FVG, 5+5 BOS, 3+3 Sweep) |

---

## 1. Logic đúng chưa?

### v3.3 logic preserved (verified line-by-line)

| Component | v3.3 → v3.4 change |
|---|---|
| 11-row table (BIAS/Action/Conf/ATR/3-TF/Voters×3/SL×2/BOS Acc) | NO change |
| 11 voter logic (HTF/LTF/BOS/FVG/Abs/Swp/MTF/KZ/Cnfl/OB) | NO change |
| P5 NO SIGNAL threshold | NO change |
| P6 BOS Accuracy stat | NO change (uses same window) |
| Confidence calculation | NO change |
| SL/TP calculation | NO change |

### v3.4 NEW: Cap mechanism (per side, FIFO)

```pine
// Top of script (after inputs, before drawing)
var box[]  bullOBBoxes    = array.new<box>(0)
var box[]  bearOBBoxes    = array.new<box>(0)
var box[]  bullFVGBoxes   = array.new<box>(0)
var box[]  bearFVGBoxes   = array.new<box>(0)
var line[] bosUpLines     = array.new<line>(0)
var line[] bosDnLines     = array.new<line>(0)
var label[] sweepBullLbls = array.new<label>(0)
var label[] sweepBearLbls = array.new<label>(0)

// When drawing a new OB box:
array.push(bullOBBoxes, b)
if array.size(bullOBBoxes) > maxVisOB
    box.delete(array.shift(bullOBBoxes))   // delete oldest
```

**Why "per side" instead of "total max"?**
- Bull/Bear zones are at DIFFERENT price levels — they don't overlap visually
- Capping total (e.g., 5 OB) would mean: if 4 bull + 1 bear, no more bull can be drawn even if 10 new bear levels emerge
- Per-side cap = fair to both directions, lets chart show complete picture of both sides

### v3.4 NEW: Removed `extend=extend.right` from OB/FVG

**Old (v3.3)**: OB box extends infinitely to right → stacks behind new boxes
**New (v3.4)**: OB box has finite window (20 bars for OB, 5 bars for FVG) + cap

**BOS kept `extend.right`**: BOS levels (key high/low break) are useful even when old — trader uses them to identify S/R flip zones

---

## 2. Workflow ổn chứ?

### TradingView Pine Editor Save button is BROKEN via API

**Symptom**: `pine set` programmatic value replacement doesn't trigger Monaco's `onDidChangeContent` event. Save button stays in "saved" state.

**Failed auto-deploy attempts (6/6)**:
1. `pine save` (Ctrl+S dispatched) — no network POST
2. Force `monaco.applyEdits` — model changed but React dirty state still "saved"
3. Click Save button via React fiber onClick — called but library not updated
4. Type real char via `ui keyboard Space` — model changes but Save still disabled
5. `chart.createStudy("USER;...")` — built-in only, fails for custom Pine
6. Click "Add to chart" button — adds instance from LIBRARY (v3.3), not editor (v3.4)

**Working manual flow (5 mins)**:
1. Open Pine Editor
2. Type any char (e.g., space) → Save button activates
3. Click Save → library updated
4. Click "Add to chart" or "Update on chart"

**Detection**: `tv pine list` shows `modified` Unix timestamp. If unchanged after `pine set`, library not updated.

### Workflow implications

- v3.4 deployment requires user in front of TradingView Desktop
- Any v3.5+ changes will also need manual Save
- This is a TradingView bug, not Mavis limitation — no API workaround exists
- Long-term: maybe build a "type real char + Save" automation via CDP, but risky (might trigger real trades if monitoring alerts)

### CI/CD

- No CI for `tradingview-mcp/` (no `.github/workflows/`)
- Tests: `npm test` (8 e2e/unit suites) — passes locally
- Pine compile check via `tv pine check -f current.pine` — pre-deploy sanity check

---

## 3. Thiếu tính năng gì?

### Cap values — are they too aggressive?

| Symbol | Cap (per side) | Max visible | Verdict |
|---|---|---|---|
| OIL 15m (high vol) | 5 OB / 3 FVG | 16 boxes | ✅ At cap, chart clean |
| GOLD 1h (mid vol) | 5 OB / 3 FVG | 16 boxes | ✅ At cap |
| GIGGLE 1h (low vol) | 5 OB / 3 FVG | 16 boxes | ✅ At cap |
| ACE 15m (low vol) | 5 OB / 3 FVG | 16 boxes | ✅ At cap |

All 4 test symbols hit cap exactly → caps are **well-calibrated** for current volatility range. No "too few" or "too many" issues.

### Features NOT added in v3.4 (deferred to v3.5+)

From Priority 8 backlog:
- "Hide all drawings" master switch (1 input, 0 logic change)
- "Fade by age" for older OBs (color fade based on bar distance)
- "Consolidate mode" (merge adjacent OBs of same side)
- Auto-remove BOS line on structure reverse
- OB retest V11: distance-based weighting

These are clean feature additions, not bug fixes. Better as separate session.

---

## 4. Rủi ro tiềm ẩn

### R1: Cap values are static (5 OB) — could be too few in extreme volatility

- **Scenario**: Flash crash or parabolic move → many new OBs created rapidly → cap deletes useful older OBs
- **Mitigation**: User can tune `maxVisOB` 1-20 via input. Default 5 works for normal markets.
- **Status**: Acceptable. Trader who needs more can bump to 10.

### R2: `extend.right` removed from OB → might lose visual context

- **Scenario**: Trader looking back 50 bars sees OB at bar 30 but its box only extends 20 bars → invisible
- **Mitigation**: Cap logic keeps the LAST 5 OB per side, so most recent context is always visible
- **Status**: Acceptable. v3.3's `extend.right` was the cause of stacking — removal is net positive.

### R3: BOS still has `extend.right` → could still stack

- **Scenario**: 100+ BOS in volatile market → 10 lines stacking at recent price
- **Mitigation**: 5 BOS per side cap (10 total max). New BOS pushes old one out.
- **Status**: Acceptable. BOS lines are thin 1px so even 10 stacking is cleaner than OB/FVG boxes.

### R4: Pine v6 declare-before-use rule could break in future refactors

- **Scenario**: Someone (Mavis) adds new feature that needs new `var` array, declares in wrong place
- **Mitigation**: Document pattern in this PRE_CHECK. Always place `var` arrays at top of script.
- **Status**: Mitigated. Future session should follow this convention.

### R5: Project GitHub account = `miniSHIBAinu`, easy to confuse with `monet88`

- **Scenario**: New session starts, Mavis reads old memory with `monet88` → tries to push to wrong repo
- **Mitigation**:
  - Hard lesson: verify account via `GET /api.github.com/user` with token BEFORE every push
  - `package.json` repo URL fixed session 8 (was stale `monet88`)
  - Token in `tradingview-mcp/.env.local` section `#dotnear` belongs to `miniSHIBAinu` (id 93213299)
- **Status**: Mitigated, but eternal vigilance required.

---

## Multi-symbol validation (session 8)

After session 7 handoff, ran v3.4 on 4 symbols to verify cap logic + render:

| Symbol | TF | BIAS | Conf | BOS Acc | Boxes | Lines | Labels | 11-row |
|---|---|---|---|---|---|---|---|---|
| OILWTIUSDT.P | 15m | 🟢 LONG (Strong buy) | 67% | 4/6 (67%) | 16 | 10 | 6 | ✓ |
| GOLDXAUUSDT.P | 1h | ⚫ NO SIGNAL | 22% | 4/10 (40%) | 16 | 10 | 6 | ✓ |
| GIGGLEUSDT.P | 1h | ⚫ NO SIGNAL | 11% | 2/6 (33%) | 16 | 10 | 6 | ✓ |
| ACEUSDT.P | 15m | ⚫ NO SIGNAL | 0% | 4/8 (50%) | 16 | 10 | 6 | ✓ |

**Findings**:
- All 4 symbols hit cap exactly (5+5 OB + 3+3 FVG = 16 boxes) — caps well-calibrated
- 11-row table renders correctly across all symbols
- BIAS/Action/Confidence logic works (OIL = LONG, others = NO SIGNAL due to low conf)
- BOS Acc varies (33%-67%) — reflects actual market conditions
- 2 ACE user alerts (5382498900 + 5382498903) preserved after symbol switch

Screenshots in `tradingview-mcp/screenshots/` (gitignored):
- `oil-15m-v34.png`
- `gold-1h-v34.png`
- `giggle-1h-v34.png`
- `ace-15m-v34.png`

---

## Session 7 + 8 deliverables (verified)

| Deliverable | Status |
|---|---|
| `tradingview-mcp/scripts/current.pine` v3.4 (25,449 B, 512 lines) | ✅ |
| `tradingview-mcp/scripts/current.v3.4.pine` backup (identical) | ✅ |
| `tradingview-mcp/scripts/current.v3.3.pine` rollback (22,361 B) | ✅ |
| Compile clean (server + Monaco) | ✅ 0 errors |
| Chart instance LIVE (verified SNDK 15m + 4 other symbols) | ✅ |
| `docs/SESSION_7_HANDOVER.md` (8,389 B) | ✅ |
| `docs/CONTEXT.md` updated (32,653 B → ~34,000 B with session 8) | ✅ |
| `docs/V3_4_PRE_CHECK.md` (this file) | ✅ |
| `package.json` repo URL fix (monet88 → miniSHIBAinu) | ✅ Committed a747961, pushed |
| GitHub push to `miniSHIBAinu/tradingview-mcp` @ `chore/tdv-vps-foundation` | ✅ Commits 205d3f5 + a747961 |

---

## Lessons cho next session

1. **Pine v6 "declare before use"** — all `var` arrays must be at top of script, after inputs, before any drawing code. Forward-reference = CE10272.

2. **Project account is `miniSHIBAinu` (id 93213299), NOT `monet88`** — verify with `GET /api.github.com/user` before every push. Memory cũ ghi `monet88` for chang-store is SAI. Per-project account scope.

3. **TradingView Pine Editor Save button broken via API** — manual save required. Workflow: type any char → Save → Add to chart.

4. **Cap values (5 OB / 3 FVG / 5 BOS / 3 Sweep) are per-side** — total max = 16 boxes, 10 lines, 6 labels. All 4 test symbols hit cap exactly.

5. **When bumping version, search for ALL string mentions of old version** — not just changelog, also `indicator(...)` title.

6. **Audit inherited inputs/variables from previous version** — `bosAccWinBars` was v3.3 leftover, never used in v3.4.

7. **TV Desktop port = 9222, not 9333 default** — set `TV_CDP_PORT=9222` env var for every `tv` command (or set in `tradingview-mcp/.env.local` for permanent fix).

8. **`docs/` directory is OUTSIDE the `tradingview-mcp/` git repo** — CONTEXT.md / handover updates are local-only, not committed. Tradeoff: kept separate for personal context flexibility. If collaboration is needed, move docs into repo.

9. **3-pre-check-pass pattern works** — each pass went deeper (logic → dead code → declaration order). User catch the next level. Apply for v3.5+.

---

## Open questions for session 9+

1. Should we add "Hide all drawings" master switch (1 input, 0 logic change)? Manual save required but easy.
2. Should we migrate `docs/` into `tradingview-mcp/docs/` so docs are version-controlled with code?
3. Should we set `TV_CDP_PORT=9222` permanently in `tradingview-mcp/.env.local`?
4. Should we add a CI workflow that runs `tv pine check -f current.pine` on PR to catch forward-ref errors early?
