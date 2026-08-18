# CONTEXT.md — Persistent Session Context

**Mục đích**: Lưu state quan trọng giữa các sessions. Update mỗi khi có thay đổi lớn hoặc trước khi kết thúc session. File này là SINGLE SOURCE OF TRUTH cho dự án `mtradview`.

**Cập nhật lần cuối**: 2026-08-18 12:55 (session 7 — v3.4 deployed + pushed to `miniSHIBAinu/tradingview-mcp`, 3 bug-fix passes complete)

---

## 🚨 CRITICAL: Project GitHub Account

**THIS PROJECT IS `miniSHIBAinu`, NOT `monet88`** (user explicitly corrected multiple times).

- **Remote URL** (updated session 7): `https://github.com/miniSHIBAinu/tradingview-mcp.git`
- **Account**: `miniSHIBAinu` (id 93213299)
- **Token location**: `G:\VIBE\mtradview\tradingview-mcp\.env.local` (section `#dotnear`, `GITHUB_TOKEN=ghp_...TVLj`)
- **NEVER assume `monet88` for this project** — old memory entries had it wrong, user has corrected multiple times
- **Token verification**: `gh api user` or `Invoke-RestMethod /api.github.com/user` with token from `.env.local` BEFORE any push

## 🚨 CRITICAL: `current.pine` is GITIGNORED

```
.gitignore line 3: scripts/current.pine
```

- **Only `current.vN.pine` backups are tracked** (v1, v2, v3.1, v3.2, v3.3, v3.4)
- The "live" script `current.pine` exists only locally + gets pushed to TradingView
- This is by design — only the rollback history is in git, the working version is per-machine
- **Workflow**: edit `current.pine` → if it's a new version, copy old to `current.vN.pine` first → commit the new backup → deploy via `pine_push.js`

## 🚨 CRITICAL: TradingView Pine Editor Save button broken via API

See `mavis` memory entry "TradingView Pine Editor auto-deploy limitation (2026-08-18, mtradview)".
- Programmatic `setValue()` doesn't trigger Monaco's `onDidChangeContent` event
- Save button stays in "saved" state even when content differs from library
- Library cache never updates via API
- **Manual workaround (5 mins)**: type any char in editor → Save button activates → click Save → click "Add to chart" / "Update on chart"

---

## Dự án: `mtradview` (TradingView MCP)

**Workspace**: `G:\VIBE\mtradview\`
**Sub-project**: `G:\VIBE\mtradview\tradingview-mcp\` (Node.js MCP server + Pine Script indicators)
**Docs folder**: `G:\VIBE\mtradview\tradingview-mcp\docs\` (CONTEXT.md, SESSION_HANDOVER_*, CONSENSUS_DASHBOARD.md, V3_2_PRE_CHECK.md, etc.) — session 8: moved into tradingview-mcp repo for version control

### Tech stack
- **MCP server**: Node.js ESM, `@modelcontextprotocol/sdk@^1.12.1`, `chrome-remote-interface@^0.33.2`
- **Pine Script**: v6 (overlay indicator)
- **Transport**: stdio MCP + local CLI (`node src/cli/index.js <cmd>`)
- **CDP**: TradingView Desktop Electron, port 9222 (user setup) or 9333 (upstream default)
- **Code knowledge graph**: CodeGraph (installed v1.5.0, indexed 80 files)
- **Pine push helper**: `scripts/pine_push.js` (custom, reads `TV_CDP_PORT` env var, port 9222)

### Mục tiêu hiện tại
Xây dựng **Consensus Dashboard v3.2** — Pine Script indicator overlay trên TradingView, tổng hợp signal từ 9 voters (HTF, LTF, BOS, FVG, Absorption, Killzone, 3-TF Confluence, Liq Sweep, MTF) thành BIAS (LONG/SHORT/NEUTRAL/WEAK LONG/SHORT) với action guidance + chart drawings (HTF EMA, BOS lines, FVG boxes, OB boxes, sweep labels, killzone bg, premium/discount tint) + asset preset auto-default.

---

## Trạng thái phase hiện tại (2026-08-17)

| Phase | Status |
|---|---|
| 1-7 | ✅ Done (early sessions) |
| 8 - UX improvements (v2) | ✅ Done + deployed |
| 9 - Threshold tuning (WEAK state) | ✅ Done |
| 10 - Manual deploy v2 | ✅ Done (user clicked) |
| 11 - Repo update (vps-foundation) | ✅ Done (branch checked out) |
| 12 - CEO/PM review (v3.1) | ✅ Done |
| 13 - v3.1 deploy + verify | ✅ Done (deployed on BINGX:OILWTIUSDT.P + GIGGLEUSDT.P + others) |
| 14 - CodeGraph install | ✅ Done (1.5.0, 80 files, MCP already wired) |
| 15 - v3.2 code (5 priorities) | ✅ Done (compile clean, 0 errors) |
| 16 - Round 1 pre-check (4 tiêu chí) | ✅ Done (V3_2_PRE_CHECK.md) |
| 17 - Round 2 pre-check + bug fix | ✅ Done (4 dead code issues removed, re-compile clean) |
| 18 - Update docs (P7) | ✅ Done (V3_2_PRE_CHECK + CONSENSUS_DASHBOARD + SESSION_4_HANDOVER) |
| 19 - Deploy v3.2 + test (P2) | ⏸ Pending user click (MCP-MONACO disconnect) |
| 20 - Bias watcher (P3) session 5 | ✅ Done (watcher.js + WATCHER.md, end-to-end tested 5 scenarios) |
| **21 - v3.3 code (P4/P5/P6) session 6** | ✅ Done (22,361 B, 460 lines, 0 bugs after Round 2 fix) |
| **22 - v3.4 visual cleanup session 7** | ✅ Done + deployed (25,449 B, 512 lines, 3 bug-fix passes, 0 errors, pushed to `miniSHIBAinu/tradingview-mcp`) |

---

## Code Pine Script hiện tại

**File**: `G:\VIBE\mtradview\tradingview-mcp\scripts\current.pine` (v3.4, **25,449 bytes, 512 lines, 21 inputs** — `current.pine` is GITIGNORED, only backups tracked)

**Backups (tracked in git)**:
- `current.v1.pine` (4,140 bytes) — version 1 baseline
- `current.v2.pine` (6,215 bytes) — UX-improved v2 (emoji + action guidance)
- `current.v3.1.pine` (11,306 bytes) — v3.1 (9 logic fixes + per-asset presets)
- `current.v3.2.pine` (19,370 bytes) — v3.2 (P1-P5: drawings + OB + sweep + 3-TF + asset preset)
- `current.v3.3.pine` (22,361 bytes) — v3.3 (P4 OB retest V10 + P5 NO SIGNAL + P6 BOS Acc)
- `current.v3.4.pine` (25,449 bytes) — **v3.4 current** (visual cleanup: 4 maxVis inputs + 8 cap arrays + 3 bug fixes)

**v3.4 features added** (vs v3.3):
1. **4 maxVis inputs** (Drawings group): `maxVisOB=5`, `maxVisFVG=3`, `maxVisBOS=5`, `maxVisSweep=3` — cap visual elements to last N most recent
2. **8 cap-tracking arrays** (declared at top, line 50-57, after inputs): `bullOBBoxes`, `bearOBBoxes`, `bullFVGBoxes`, `bearFVGBoxes`, `bosUpLines`, `bosDnLines`, `sweepBullLbls`, `sweepBearLbls`
3. **OB boxes**: removed `extend=extend.right` (was causing stacking), finite window 20 bars, cap 5 per side
4. **FVG boxes**: removed `extend=extend.right`, finite window 5 bars, cap 3 per side
5. **BOS lines**: kept `extend=extend.right` (level useful until broken), cap 5 per side
6. **Sweep labels**: cap 3 per side
7. **Cap logic**: `array.push` newest + `if size > max: array.shift` + `box/line/label.delete` oldest
8. **3 bug fixes from CEO pre-check passes**:
   - Title `Consensus Dashboard v3.3` → `v3.4` (line 2)
   - Removed dead input `bosAccWinBars` (v3.3 leftover, never used in cumulative logic)
   - Moved 8 array declarations from OB section (line 221) to top (line 50) — was causing CE10272 undeclared identifier error because BOS code on line 170 referenced `bosUpLines` before declaration

**Total voters v3.4**: 10 (same as v3.3) — V1 HTF, V2 LTF, V3 BOS, V4 FVG, V5 Absorption, V6 Killzone, V7 3-TF Confluence, V8 Liq Sweep, V9 MTF, V10 OB Retest

**Compile status**:
- `pine errors`: ✅ 0 errors (`has_errors: false, error_count: 0`)
- Monaco editor markers: ✅ 0 errors
- `pine check` (server-side): reports Monaco noise `e.equals is not a function` — known false positive (also seen in v3.3 deploy)
- Deployed: v3.4 LIVE on chart (entity `ptabnN` or user's manually-added instance on SNDK 15m)

---

## Workflow & Environment

### TV Desktop
- Process: `C:\Program Files\WindowsApps\TradingView.Desktop_3.3.0.7992_x64__n534cwy3pjxzj\TradingView.exe`
- Local copy (MSIX fallback): `C:\Users\User\AppData\Local\tradingview-mcp\TradingView\TradingView.exe`
- **Current port: 9222** (user setup, kept stable across sessions)
- Launch command: `start "" "C:\Users\User\AppData\Local\tradingview-mcp\TradingView\TradingView.exe" --remote-debugging-port=9222`

### MCP server
- Entry: `cd G:\VIBE\mtradview\tradingview-mcp && node src/cli/index.js <cmd>`
- **MUST set `TV_CDP_PORT=9222` env var** (upstream code defaults to 9333 since vps-foundation merge)
- Current branch: `chore/tdv-vps-foundation` @ `fa80794`
- Upstream main: `f0c6ed51` (we are 9 commits ahead with VPS bridge features)

### Pine push helper (improved session 4)
- **File**: `tradingview-mcp/scripts/pine_push.js`
- **Usage**: `TV_CDP_PORT=9222 node scripts/pine_push.js`
- **What it does**: 
  1. Inject `scripts/current.pine` to Monaco editor (React fiber traversal)
  2. Click "Pine Save" button (compile)
  3. Verify 0 errors via `getModelMarkers()`
- **Bypasses** MCP-MONACO disconnect (kind of — still doesn't auto-add to chart)
- **Session 4 change**: read `TV_CDP_PORT` / `TV_CDP_HOST` env var (was hard-coded 9333/localhost)

### CodeGraph
- v1.5.0 installed globally (`npm i -g @colbymchenry/codegraph@latest`)
- Initialized: `G:\VIBE\mtradview\.codegraph\` (2.84 MB SQLite DB, 80 files, 630 nodes, 2,206 edges)
- Status: indexed, auto-syncs on save
- MCP server already in `C:\Users\User\.minimax\mcp\mcp.json` (auto-detects from session working dir)
- Re-index after big changes: `codegraph sync` in project root

### Local MCP config
- Path: `C:\Users\User\.minimax\mcp\mcp.json`
- CodeGraph entry (already exists)
- **NO tradingview MCP in local mcp.json** — using `node src/cli/index.js` CLI directly via bash. If want MCP integration, add similar entry pointing to `node G:\VIBE\mtradview\tradingview-mcp\src\server.js` with `TV_CDP_PORT=9222` env.

---

## Quyết định quan trọng (record for future)

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Pine overlay approach | Native, no infra, MCP read-back dễ |
| 2 | 6 voters equal weight MVP | Phase 2 add dynamic weights |
| 3 | 60% strong + 40% weak thresholds | Balance signal noise vs missed opportunities |
| 4 | HTF="D" for default 15m-1H charts | Daily provides macro context |
| 5 | ATR=20 default for swing | User adjustable per asset |
| 6 | Keep port 9222 (NOT 9333) | User's existing setup, don't disrupt |
| 7 | V3.1 dropped chart drawings | Avoid separate-pane issue, work as overlay |
| 8 | CodeGraph installed | Helps navigate Node.js MCP server code in future sessions |
| 9 | Per-asset dropdown informational only (v3.1) | Pine v6 doesn't allow const→series default values |
| 10 | V3.2: switch on assetType for SL/TP defaults (P5) | Workaround for v3.1 limitation |
| 11 | V3.2: 9 voters (added V7 conf, V8 sweep, V9 MTF) | More granular signals |
| 12 | V3.2: MTF res as function `f_selectMtf()` | Avoid multi-line nested ternary Pine v6 error |
| 13 | V3.2: `max_*_count=500` for drawings | Pine v6 default, ensure space for 405 lines worth of graphics |
| 14 | `pine_push.js` reads `TV_CDP_PORT` env var | Was hard-coded 9333, now portable |
| 15 | Watcher header-based parser (not index-based) | v3.1 has 8 rows, v3.2 has 10. Index would break across versions. |
| 16 | Watcher tracks ONLY watcher-created alert_ids in state | Don't accidentally delete user's manual alerts (e.g. session 3's ACEUSDT.P). |
| 17 | V3.3: V10 OB tracking ALWAYS runs (independent of showOB toggle) | Drawing and voting are separate concerns. User can disable drawing but keep vote. (Round 2 fix) |
| 18 | V3.3: NO SIGNAL uses gray bg (not black) | Black invisible on dark TradingView theme. Gray works on both. (Round 2 fix) |
| 19 | V3.3: BOS Acc is "from BOS to current close" (cumulative) | Simpler than "next M bars" — answers "if I entered at BOS, would I be up now?" |
| 20 | V3.4: cap visual elements via `array.push` + `array.shift` + `box/line/label.delete` | Prevent chart clutter; user-tunable via 4 inputs in Drawings group. OB tracking (var) still always-on for V10 voter — only drawing is capped. |
| 21 | V3.4: remove `extend=extend.right` from OB/FVG boxes (keep on BOS lines) | OB/FVG are historical zones — finite window makes more sense. BOS levels extend until broken, useful as reference. |

---

## Lessons cho session mới

1. **Always set `TV_CDP_PORT=9222` env var** when running MCP commands. Upstream defaults to 9333 since vps-foundation merge.
2. **Pine Editor deploy is MANUAL** (MCP-MONACO disconnect known limitation). User must click "Add to chart" / "Update on chart" themselves after `pine set + compile + save` or `pine_push.js`.
3. **`pine_push.js`** (custom helper, port 9222) is more reliable than MCP `pine set + save` chain. Use it for future deploys.
4. **Pine Editor multiple tabs**: `pine new` tạo tab mới (Untitled). Source injected có thể vào tab mới thay vì tab "My script". Visual lag — `pine get` reflects current state but screenshot might be stale.
5. **"Publish script" button** in Pine Editor = community publish, không phải cloud save. KHÔNG click nếu chỉ muốn private save.
6. **Pine v6 không accept multi-line nested ternary**. Refactor to function với switch statement.
7. **`if barstate.islast` block** in Pine: MCP `data_get_pine_tables` reads the LAST bar's table state. Always test that the table is rendering by reading data.
8. **User's trading style**: active trader, switches charts frequently, expects quick signal interpretation. Dashboard v3.2 addresses this with 9 voters + emoji + action guidance + confidence bar + chart drawings.
9. **MTF resolution auto-computed** via `f_selectMtf()` function from current TF. Covers 1, 3, 5, 15, 30, 45, 60, 120, 180, 240. Default to D for unmapped.
10. **Liq sweep conservative**: requires close on specific side (bull sweep = close < open, bear sweep = close > open). Filters "trap + reversal follow-through" pattern. By design.
11. **CLI command names ≠ MCP tool names**: `tv symbol` (not `chart_set_symbol`), `tv data tables -f X` (not `data_get_pine_tables`). Check `src/cli/commands/*.js` for actual sub-commands.
12. **Watcher state isolation**: never delete alerts not in `state.lastAlertIds`. User's manual alerts (e.g. session 3's ACEUSDT.P) are safe from watcher cleanup. Verified by 5-scenario end-to-end test.
13. **TradingView API rounds 2-decimal prices** in alert payload — for OIL, 82.99 becomes 83. Documented; user should know.
14. **TV Desktop port 9222 is volatile** — may close after long idle. Re-launch from `C:\Users\User\AppData\Local\tradingview-mcp\TradingView\TradingView.exe` with `--remote-debugging-port=9222`.
15. **Pine Editor Monaco must be seeded** before `pine_push.js` — use `tv pine open "My script"` first to load any saved script. Fresh TV has no Monaco instance.
16. **Pine voting logic must be unconditional** (not gated by drawing toggles) — if user disables OB drawing, V10 should still vote. Drawing is visualization, not logic. (Round 2 lesson from v3.3)
17. **V3.4: cap visual elements via `array.push` + `array.shift` + `box/line/label.delete`** — prevent chart clutter; user-tunable via 4 inputs in Drawings group. OB tracking (var) still always-on for V10 voter — only drawing is capped.
18. **V3.4: remove `extend=extend.right` from OB/FVG boxes (keep on BOS lines)** — OB/FVG are historical zones — finite window makes more sense. BOS levels extend until broken, useful as reference.
19. **Pine v6 enforces "declare before use"** — all var declarations must come before first reference in source order. Forward-reference causes CE10272 undeclared identifier error. (Lesson from v3.4 bug fix pass 3)
20. **Dead inputs (declared but never used) are technical debt** — they confuse users, take input slots, and trigger lint warnings. Always grep for unused inputs after adding new code. (Lesson from v3.4 bug fix pass 2)
21. **`current.pine` is GITIGNORED** — only `current.vN.pine` backups tracked. Working version is local-only + pushed to TradingView. Always backup before major edits. (Project convention)
22. **GitHub account is project-scoped, not global** — this project uses `miniSHIBAinu` (id 93213299), token in `.env.local` section `#dotnear`. NEVER use other project accounts (`newmylab` for AI-auto-generate-video, `miniSHIBAinu` also for chang-store, etc.). Verify with `gh api user` BEFORE any push. (User has corrected this multiple times)

---

## Việc đã làm (chronological)

### Session 1-2 (2026-08-15)
- Initial setup, read handover docs, pre-check feasibility
- Built Pine Script v1 (93 lines), 2 bugs fixed (SHORT unreachable, BOS false-trigger)
- Deploy via Pine Editor (manual paste) → worked
- User feedback: "không hiểu indicator, signal đâu"

### Session 3 (2026-08-16)
- Updated docs/SESSION_HANDOVER_2026-08-15.md and CONTEXT.md
- Built UX-improved v2 (8 rows, emoji, confidence bar, action guidance, voter breakdown)
- Deployed v2 on BINGX:GIGGLEUSDT.P 1D (manual click)
- Setup 2 price alerts on BINGX:ACEUSDT.P 15m (0.15 long TP, 0.13 short SL)
- Updated CONTEXT.md with session 3 status

### Session 3.5 (2026-08-17)
- CEO/PM review 1 vòng (logic, workflow, features, risks)
- Updated GitHub upstream branch (chore/tdv-vps-foundation) with VPS bridge features
- Discovered port change (9222 → 9333 default in new code) — handled with `TV_CDP_PORT=9222` env var
- Backup v2 → current.v2.pine
- Wrote v3.1 (~14KB initially with all chart drawings) → then simplified to v3.1 (~11KB dashboard only) to fix separate-pane issue
- 9 logic fixes applied
- v3.1 saved to cloud as "My script" v3.0
- Deployed via play button on BINGX:OILWTIUSDT.P 15m → verified working
- Real-time tested on multiple charts
- Installed CodeGraph v1.5.0 globally + initialized for mtradview (80 files indexed)
- Updated CONTEXT.md

### Session 4 (2026-08-17) — v3.2 production-ready
- Wrote v3.2 Pine Script initial (19,598 B, 405 lines) — all 5 priorities (P1-P5)
- 9 voters (was 6 in v3.1): added V7 3-TF Confluence, V8 Liq Sweep, V9 MTF
- Chart drawings: HTF EMA line, BOS lines, FVG boxes, OB boxes, sweep labels, killzone bg, premium/discount tint
- Asset preset: switch on assetType at runtime for SL/TP defaults
- Fixed Pine v6 multi-line nested ternary → refactored to `f_selectMtf()` function
- v3.1 backed up to `current.v3.1.pine` (11,306 B, 244 lines)
- Compile clean via `pine check` (server-side) + `pine_push.js` (live TV)
- `pine_push.js` edited to read `TV_CDP_PORT` env var (was hard-coded 9333)
- Tried auto-deploy to chart: MCP-MONACO disconnect (chart still shows v3.1, v3.2 in Pine Editor awaiting user manual click)
- Wrote `docs/V3_2_PRE_CHECK.md` (initial 14,427 B) — Round 1 pre-check
- Updated `docs/CONSENSUS_DASHBOARD.md` (10,658 B) with v3.2 changes
- Updated this `docs/CONTEXT.md` with session 4 state
- **Round 2 pre-check**: re-scanned v3.2 code, found 4 dead code bugs:
  1. `mtfMult` input with lying tooltip → REMOVED, info merged into `htfRes` tooltip
  2. `tfAlignmentCount` unused → REMOVED
  3. `fvgTop`/`fvgBot` unused → REMOVED
  4. `alignTxt` redundant ternary → SIMPLIFIED
- After fix: 19,370 B (saved 223 B), 400 lines (saved 5 lines), 0 behavior change
- Re-compile clean, re-push clean
- Updated `docs/V3_2_PRE_CHECK.md` with Round 2 section
- Wrote `docs/SESSION_4_HANDOVER.md` (9,957 B) — detailed session 4 work log
- Updated this `docs/CONTEXT.md` with session 4 final state
- All 7 priorities addressed (5 in code, 2 in docs)

### Session 5 (2026-08-17) — Bias Watcher (P3)
- Picked P3 (Alerts Integration) as session 5 priority after CEO/PM review
- Pre-check env: TV Desktop was running but port 9222 CLOSED — re-launched with `--remote-debugging-port=9222`, port now OPEN
- Discovered CLI command names differ from MCP tool names (`tv symbol` vs `chart_set_symbol`)
- Wrote `tradingview-mcp/scripts/watcher.js` (9,895 B): bias state machine + auto SL/TP price alerts
- Tested end-to-end with 5 scenarios — all pass:
  1. First run on GOLD (NEUTRAL) — log, 0 alerts, notify
  2. Switch to OIL (LONG) — created 2 alerts (SL 81.4 less + TP 83 greater)
  3. Re-run, no change — no new alerts, fast tick (684ms)
  4. Loop mode 3 ticks — stable, no errors, no leaks
  5. Switch back to GOLD (NEUTRAL) — deleted 2 OIL alerts, count=2 (ACEUSDT only, untouched)
- Wrote `docs/WATCHER.md` (9,580 B) — full pre-check 4 tiêu chí + usage + roadmap
- Updated `docs/CONSENSUS_DASHBOARD.md` with "Alerts Workflow (P3)" section + new file table
- Updated this `docs/CONTEXT.md` with session 5 state (this entry)
- Test artifacts moved to `scripts/archive/`
- All watcher-created alerts correctly isolated from user's manual alerts (2 ACEUSDT.P from session 3 intact)

### Session 6 (2026-08-18) — v3.3 (P4 OB retest V10 + P5 NO SIGNAL + P6 BOS Acc)
- User request: "build P4/P5/P6, pre-check 4 tiêu chí, kiểm tra 1 vòng nữa, fix all, ghi vào docs/CONTEXT.md"
- Pre-check env: TV Desktop NOT running, port 9222 CLOSED — re-launched with `--remote-debugging-port=9222` from local copy
- Discovered Pine Editor Monaco must be seeded: `tv pine open "My script"` first, then `pine_push.js` works
- Discovered `tv ui open-panel` is wrong — correct: `tv ui panel pine-editor open`
- Backed up v3.2 → `current.v3.2.pine` (19,370 B, 400 lines)
- Wrote v3.3 Pine Script (initial: 22,246 B, 457 lines) — 3 priorities in one pass:
  - **P4**: V10 OB retest voter (track latest bull/bear OB zones, vote on price entry)
  - **P5**: NO SIGNAL bias state (input `noSigThresh` default 30, new ⚫ emoji + action)
  - **P6**: BOS Accuracy stat (input `bosAccLookback`=50, `bosAccWinBars`=10, loop + table row 10)
- Compile clean: server-side 0 errors, live push 457 lines compiled clean
- **Round 2 pre-check** found 2 bugs:
  1. V10 OB tracking gated by `showOB` — voter stopped if user disabled drawing. **Fix**: always track, draw conditionally.
  2. `biasBg` for NO SIGNAL used `color.black` — invisible on dark theme. **Fix**: changed to `color.gray`.
- After fix: 22,361 B, 460 lines, re-compile clean (server + live push 460 lines clean)
- Wrote `docs/V3_3_PRE_CHECK.md` (14,249 B) — full Round 1 + Round 2 analysis
- Wrote `docs/SESSION_6_HANDOVER.md` (10,566 B) — session 6 work log
- Updated `docs/CONSENSUS_DASHBOARD.md` with v3.3 section + marked 3 v3.3 candidates as DONE
- Updated this `docs/CONTEXT.md` with session 6 state (this entry)
- All v3.2 logic preserved 100% (verified line-by-line)
- Branch: chore/tdv-vps-foundation @ 02b2b26 (1 commit ahead before session 6 commit)

### Session 7 (2026-08-18) — v3.4 visual cleanup + bug fixes + GitHub push
- **Trigger**: User feedback "add chart nhìn như bãi rác vậy" (chart looks like junkyard) — too many overlapping OB/FVG/Sweep drawings
- **v3.4 implementation** (0 logic change to voting):
  - Added 4 inputs in Drawings group: `maxVisOB=5`, `maxVisFVG=3`, `maxVisBOS=5`, `maxVisSweep=3` (user-tunable, per-side)
  - Added 8 cap-tracking arrays (`bullOBBoxes`, `bearOBBoxes`, `bullFVGBoxes`, `bearFVGBoxes`, `bosUpLines`, `bosDnLines`, `sweepBullLbls`, `sweepBearLbls`)
  - OB boxes: removed `extend=extend.right`, finite window 20 bars, cap 5 per side
  - FVG boxes: removed `extend=extend.right`, finite window 5 bars, cap 3 per side
  - BOS lines: kept `extend=extend.right` (level useful), cap 5 per side
  - Sweep labels: cap 3 per side
  - Cap logic: `array.push` newest + `if size > max: array.shift + delete` oldest
- **3 bug-fix passes (CEO pre-check)**:
  1. Title `Consensus Dashboard v3.3` → `v3.4` (line 2) — user caught
  2. Dead input `bosAccWinBars` removed (v3.3 leftover, never used)
  3. Forward-ref CE10272 fix — moved 8 array declarations from OB section (line 221) to top (line 50) — Pine v6 "declare before use" enforcement
- **Auto-deploy attempts (6/6 failed)** due to TradingView's Monaco dirty-state bug — user did manual Save + Add to chart
- **GitHub push**: created new repo `miniSHIBAinu/tradingview-mcp` (old `monet88` was stale, no push access), force-pushed `chore/tdv-vps-foundation` (3 commits: 205d3f5 + 9364c50 + 02b2b26)
- **Final stats**: `current.pine` 25,449 B, 512 lines, 21 inputs, 0 errors, deployed live
- **Updated CONTEXT.md** with all changes + critical learnings (account, gitignore, save button bug, declare-before-use)
- **User feedback captured**: "monet88 ko liên quan" — must remember `miniSHIBAinu` for this project, verify with `gh api user` before push

### Session 8 (2026-08-18) — v3.4 multi-symbol validation + collateral cleanup
- **Trigger**: Session 7 handoff said "Test v3.4 on more symbols (OIL, GOLD, GIGGLE, ACE — SNDK already verified)"
- **Test results** (all via `tv` CLI on port 9222, TV already running on 9333 default failed — use `TV_CDP_PORT=9222` env var):
  | Symbol | TF | BIAS | Conf | BOS Acc | Boxes | Lines | Labels | 11-row |
  |---|---|---|---|---|---|---|---|---|
  | OILWTIUSDT.P | 15m | 🟢 LONG (Strong buy) | 67% | 4/6 (67%) | 16 | 10 | 6 | ✓ |
  | GOLDXAUUSDT.P | 1h | ⚫ NO SIGNAL | 22% | 4/10 (40%) | 16 | 10 | 6 | ✓ |
  | GIGGLEUSDT.P | 1h | ⚫ NO SIGNAL | 11% | 2/6 (33%) | 16 | 10 | 6 | ✓ |
  | ACEUSDT.P | 15m | ⚫ NO SIGNAL | 0% | 4/8 (50%) | 16 | 10 | 6 | ✓ |
- **Cap logic verified** (all 4 symbols hit cap exactly, not over): 16 boxes = 5 OB↑ + 5 OB↓ + 3 FVG↑ + 3 FVG↓ (per side). BOS = 5 up + 5 down. Sweep = 3 bull + 3 bear.
- **Alerts preserved**: ACEUSDT.P 2 alerts (5382498900 fired 2026-08-17 02:42 + 5382498903 active, expires 2026-09-15) still intact after symbol switch
- **Screenshots saved** (gitignored): `screenshots/oil-15m-v34.png`, `gold-1h-v34.png`, `giggle-1h-v34.png`, `ace-15m-v34.png`
- **Collateral fix**: `package.json` repo URL was stale `monet88/tradingview-mcp` → updated to `miniSHIBAinu/tradingview-mcp` (matches actual remote) — committed `a747961`, pushed

### Session 8 (cont.) — 4 priority tasks CEO batch (env loader, v3.5, docs migration, CI)

**Trigger**: User feedback "làm tất cả bạn" after listing 4 open questions from V3_4_PRE_CHECK.

**Task 1 — `hideAllDrawings` master switch → v3.5** (Priority 8 #1)
- Added 1 input `hideAllDrawings` to Drawings group (default false) + `and not hideAllDrawings` modifier on 5 show* toggles
- 22 inputs total (was 21)
- KZ + PDisc background tints NOT affected (intentional)
- `current.pine` 25,997 B, 514 lines, 0 errors compile + 0 issues static analyze
- `current.v3.5.pine` backup created
- Pushed to Pine Editor Monaco view (514 lines, 0 errors compile)
- **Manual save required** (Monaco dirty-state bug, session 7 known limitation) — user needs to type char + Save + Update chart

**Task 2 — `TV_CDP_PORT=9222` permanent**
- Added `TV_CDP_HOST=127.0.0.1` + `TV_CDP_PORT=9222` to `.env.local` (gitignored, local)
- Updated `.env.example` to document (TV port 9222, not 9333 default — session 8 learning)
- Added auto-load in `src/connection.js` using `process.loadEnvFile('.env.local')` (Node 20.12+, zero-dep, file-optional)
- Removed equivalent block from `src/cli/index.js` (ESM import hoisting issue — connection.js loads first via its own imports)
- **Verified**: `tv state` works without manual env var

**Task 3 — Migrate docs/ into tradingview-mcp/docs/**
- Moved 14 .md files from `G:\VIBE\mtradview\docs\` → `G:\VIBE\mtradview\tradingview-mcp\docs\`
- 4 files in subdirs (`docs/agents/*.md`, `docs/deployment/*.md`) were already tracked in repo (different session, different origin)
- Old `G:\VIBE\mtradview\docs\` deleted
- No code/script references to old path (grep clean) — safe to move
- CONTEXT.md line 44 path ref updated
- **Tradeoff**: lost flexibility (docs now coupled to code repo) but gained version control + portable across clones

**Task 4 — CI workflow `pine-check`**
- New: `scripts/check-pine-declarations.mjs` (4,813 B) — static checker for Pine v6 "declare before use" rule (CE10272 forward-ref detection)
- New: `.github/workflows/pine-check.yml` (1,392 B) — GH Actions workflow on push/PR, runs:
  1. `npm run test:unit` (excludes e2e.test.js which needs TV)
  2. Static checker on all `current.v*.pine` files
  3. `tv pine analyze` (offline, no TV needed)
- Tested with synthetic forward-ref → detected correctly (exit 1)
- Tested on v3.4 + v3.5 → 0 errors
- **CI green**: After 3 fix iterations:
  1. Removed `working-directory: tradingview-mcp` prefix (workflow file already in repo → path doubling)
  2. Switched `npm test` → `npm run test:unit` (e2e test needs TV)
  3. Made `tests/deployment.test.js` TV_CDP_PORT-port-agnostic + skipped `pine_check` suites in `tests/cli.test.js` and `tests/pine_analyze.test.js` for CI (need TradingView REST API)
- Final CI run: all 7 main steps + post steps = success (run 32109344082)

**All 4 tasks pushed** to `miniSHIBAinu/tradingview-mcp` @ `chore/tdv-vps-foundation`:
- 0bceec4: env loader
- 988cb55: v3.5
- 80eff0b: docs migration
- 818c8d1: CI workflow
- 7d5d5f3: fix(ci) path-doubling
- 8fa6562: fix(ci) test:unit
- b47459b: fix(tests) deployment + cli
- efaa082: fix(tests) pine_analyze skip

**User will manual-save v3.5 to chart** (type char + Save + Update on chart) — Monaco dirty-state bug persists.

---

## Pending work (next session)

### Priority 1: ✅ DEPLOYED v3.4 to chart (session 7) + pushed to GitHub
- v3.4 LIVE on chart (user manually added via "Add to chart" after manual Save, since TradingView's save button is broken via API)
- v3.4 source pushed to Pine Editor (512 lines, 25,449 B, title "Consensus Dashboard v3.4")
- Chart instance renders 11-row table + cap logic working (verified: 5 OB, 3 FVG, 5 BOS, 3 Sweep max visible)
- **Pushed to GitHub**: `miniSHIBAinu/tradingview-mcp` @ `chore/tdv-vps-foundation` (commit `205d3f5`)
- **Critical account discovery**: project account is `miniSHIBAinu` (id 93213299), NOT `monet88`. The token in `.env.local` belongs to `miniSHIBAinu`. Old remote URL `monet88/tradingview-mcp` was stale — created new repo + force-pushed.

### Priority 2: ✅ DONE session 8 — v3.4 multi-symbol validation
- 4 symbols tested (OIL 15m, GOLD 1h, GIGGLE 1h, ACE 15m) — see Session 8 entry above
- All 4 pass: 11-row table, cap logic at max, BOS Acc, NO SIGNAL state working
- ACE 2 alerts preserved after symbol switch

### Priority 3: ~~Alerts integration~~ — ✅ DONE session 5
- Watcher implemented in `tradingview-mcp/scripts/watcher.js` (9,895 B)
- End-to-end tested 5 scenarios, all pass
- See `docs/WATCHER.md` for full pre-check + usage
- External notifications (Telegram/email/toast) deferred to v2

### Priority 4: ~~OB retest as V10 voter~~ — ✅ DONE session 6
### Priority 5: ~~Confidence threshold filter~~ — ✅ DONE session 6
### Priority 6: ~~Backtest mode~~ — ✅ DONE session 6
### Priority 7: Re-create ACEUSDT.P alerts if expired
- 5382498900: ACEUSDT.P crosses 0.15 (long breakout) — expires 2026-09-15
- 5382498903: ACEUSDT.P < 0.13 (short breakdown) — expires 2026-09-15

### Priority 8 (session 8+ candidates — not started):
- "Hide all drawings" master switch (1 input, 0 logic change)
- "Fade by age" for older OBs (color fade based on bar distance)
- "Consolidate mode" (merge adjacent OBs of same side into one zone)
- Auto-remove BOS line when structure reverses (cleaner chart)
- OB retest V11: distance-based weighting (closer retest = stronger signal)

---

## File locations (quick reference)

| File | Purpose |
|---|---|
| `tradingview-mcp/scripts/current.pine` | Pine Script v3.4 (current, 25,449 B, 512 lines, 21 inputs — GITIGNORED) |
| `tradingview-mcp/scripts/current.v3.4.pine` | Backup v3.4 (25,449 B, 512 lines — same as current) |
| `tradingview-mcp/scripts/current.v3.3.pine` | Backup v3.3 (22,361 B, 460 lines, pre-v3.4 rollback) |
| `tradingview-mcp/scripts/current.v3.2.pine` | Backup v3.2 (19,370 B, rollback for v3.3) |
| `tradingview-mcp/scripts/current.v3.1.pine` | Backup v3.1 (11,306 B) |
| `tradingview-mcp/scripts/current.v2.pine` | Backup v2 (6,215 B, UX-improved) |
| `tradingview-mcp/scripts/current.v1.pine` | Backup v1 (4,140 B, baseline) |
| `tradingview-mcp/scripts/pine_push.js` | Push + compile helper (port 9222, env var) |
| `tradingview-mcp/scripts/watcher.js` | Bias watcher (P3, 9,895 B, session 5) |
| `tradingview-mcp/.env.local` | **CRITICAL** — has GITHUB_TOKEN for `miniSHIBAinu` account (section `#dotnear`) |
| `docs/CONTEXT.md` | This file — persistent session context (updated session 7) |
| `docs/SESSION_6_HANDOVER.md` | Session 6 work log |
| `docs/SESSION_7_HANDOVER.md` | Session 7 handoff (8,389 B, written session 7) |
| `docs/WATCHER.md` | Watcher pre-check + usage (session 5) |
| `docs/V3_2_PRE_CHECK.md` | v3.2 pre-check analysis (CEO/PM review) |
| `docs/V3_3_PRE_CHECK.md` | v3.3 pre-check analysis with Round 2 (session 6) |
| `docs/V3_4_PRE_CHECK.md` | v3.4 pre-check (14,878 B, 3 bug-fix passes + multi-symbol validation, written session 8) |
| `docs/CONSENSUS_DASHBOARD.md` | Pre-check analysis (updated v3.2 + v3.3 + watcher) |
| `tradingview-mcp/AGENTS.md` | Project-specific agent instructions (84 tools) |
| `tradingview-mcp/src/connection.js` | **MUST** use `TV_CDP_PORT=9222` env var (defaults to 9333) |
| `C:\Users\User\.minimax\mcp\mcp.json` | Local MCP config (has codegraph) |
| `C:\Users\User\.gitconfig` | Global git config (http.postBuffer=524288000, gh credential helper) |

---

## Async operations

**No active async operations** at session end. All operations are synchronous (Pine compile, MCP commands, screenshots). No CI pipelines, no background jobs, no pending alerts (the 2 ACEUSDT.P alerts from session 3 expire 2026-09-15 — can be re-created or left to expire).

---

## Handoff prompt for next session

```
Tôi đang làm việc trên dự án mtradview (TradingView MCP + Pine Script dashboard) tại G:\VIBE\mtradview.

Đọc trước:
1. docs/CONTEXT.md (persistent state — session 7 final, v3.4 deployed)
2. tradingview-mcp/scripts/current.pine (Pine Script v3.4 — 25,449 B, 512 lines, 21 inputs)
3. tradingview-mcp/scripts/current.v3.3.pine (pre-v3.4 backup — 22,361 B, 460 lines)
4. tradingview-mcp/scripts/current.v3.4.pine (v3.4 snapshot — 25,449 B)
5. tradingview-mcp/AGENTS.md (84 tools docs)
6. tradingview-mcp/scripts/watcher.js (Bias Watcher — 9,895 B, end-to-end tested)

🚨 CRITICAL CHECKPOINT:
- **Project account = `miniSHIBAinu`** (id 93213299), NOT `monet88` (user has corrected multiple times)
- **Token in `G:\VIBE\mtradview\tradingview-mcp\.env.local` section `#dotnear`** belongs to `miniSHIBAinu`
- **Remote URL** is `https://github.com/miniSHIBAinu/tradingview-mcp.git` (was `monet88/...` before, changed session 7)
- **VERIFY with `gh api user` BEFORE any push**
- **`current.pine` is GITIGNORED** — only `current.vN.pine` backups tracked
- **TradingView Save button broken via API** — user must do manual Save + Add to chart for v3.5+

Verify state:
- TV Desktop đang chạy port 9222 (env TV_CDP_PORT=9222 cho MCP)
- CodeGraph installed, indexed 80 files
- V3.4 production-ready: scripts/current.pine (25,449 B, 512 lines, 21 inputs, compile clean 0 errors)
- V3.4 source loaded in Pine Editor (512 lines, "Consensus Dashboard v3.4")
- V3.3 backup: scripts/current.v3.3.pine (22,361 B) for rollback
- V3.4 backup: scripts/current.v3.4.pine (25,449 B)
- Branch: chore/tdv-vps-foundation @ 205d3f5 (3 commits ahead, all pushed to `miniSHIBAinu/tradingview-mcp`)
- Watcher ready: TV_CDP_PORT=9222 node scripts/watcher.js [--once] [--interval N] [--quiet]
- 2 user manual alerts intact (ACEUSDT.P from session 3, expire 2026-09-15)

Deploy status:
- v3.4 LIVE on chart (verified: SNDK 15m screenshot shows clean chart, NO SIGNAL state, BOS Acc 3/6 50%)
- 4 maxVis inputs working: 5 OB / 3 FVG / 5 BOS / 3 Sweep max per side
- Chart instance ID varies (user added via "Add to chart" — see chart's status line)

Pending work:
- ~~Priority 1: Deploy v3.4~~ → ✅ DONE session 7 (manual user click after auto-deploy blocked)
- Priority 2: Test v3.4 on OIL, GOLD, GIGGLE, ACE (SNDK already verified)
- ~~Priority 3: Alerts integration~~ → ✅ DONE session 5
- ~~Priority 4: OB retest as V10 voter~~ → ✅ DONE session 6
- ~~Priority 5: Confidence threshold filter~~ → ✅ DONE session 6
- ~~Priority 6: Backtest mode~~ → ✅ DONE session 6
- Priority 7: Re-create ACEUSDT.P alerts if expired (2026-09-15)
- Priority 8 (session 8+): hide all drawings switch, fade by age, consolidate mode, auto-remove BOS on reverse, OB retest V11

User feedback gần nhất:
- Session 5: "Bạn là CEO dự án, chọn giải pháp + tiếp tục" → chọn P3 Alerts
- Session 6: "build P4/P5/P6, pre-check 4 tiêu chí" → v3.3 done
- Session 7: "add chart nhìn như bãi rác vậy" → v3.4 visual cleanup done
- Session 7: "Pre-check trước khi coi là hoàn thành: Logic/Workflow/Missing features/Risks, kiểm tra 1 vòng nữa, fix all bugs, báo done nếu mọi thứ ok" → 3 bug-fix passes complete, deployed
- Session 7: "wtf đã bảo monet88 ko liên quan rồi mà" → account corrected to `miniSHIBAinu`, repo moved, force-pushed

Critical gotchas (read these!):
1. TradingView Pine Editor's Save button is BROKEN via API — `setValue()` doesn't trigger Monaco's onDidChangeContent event. Library cache never updates via API. User must manually type a char + click Save.
2. Pine v6 enforces "declare before use" — all var declarations must come before first reference (CE10272 error otherwise). v3.4 had this bug initially.
3. `current.pine` is GITIGNORED — always create `current.vN.pine` backup BEFORE editing `current.pine`.
4. GitHub account is project-scoped, verify with `gh api user` BEFORE any push.
5. `http.postBuffer 524288000` already in global .gitconfig (500MB, prevents HTTP 408 timeout on large pushes).
6. `TV_CDP_PORT=9222` env var REQUIRED for all MCP commands (upstream defaults to 9333).
7. `max_boxes_count=500` etc. set high enough for our usage (we use ~10-20 max).
```
