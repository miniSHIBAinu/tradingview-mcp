# ANALYSIS.md — Deep Dive: `monet88/tradingview-mcp`

> Repo: https://github.com/monet88/tradingview-mcp
> Clone: `G:\VIBE\_clones\tradingview-mcp-20260815-091157`
> Analyzed: 2026-08-15
> Status: 0 star, 0 fork (brand new publish)
> License: MIT (continuation của `tradesdontlie/tradingview-mcp`)

---

## 1. Tổng quan 1 câu

**MCP server (Model Context Protocol)** — bridge giữa AI assistant (Claude Code, Cursor, v.v.) và **TradingView Desktop** (Electron app) thông qua **Chrome DevTools Protocol (CDP)** chạy trên `localhost:9222`. Cho phép AI **đọc** chart, indicator values, Pine Script output, **điều khiển** symbol/timeframe, drawing, alerts, **viết và debug** Pine Script, **replay** practice, **stream** dữ liệu local.

---

## 2. Kiến trúc & cơ chế hoạt động

```
Claude Code  ←→  MCP Server (stdio)  ←→  CDP (port 9222)  ←→  TradingView Desktop (Electron)
```

- **Transport**: MCP qua stdio (84 tools) + CLI `tv` (30 commands, 66 subcommands).
- **Connection**: `chrome-remote-interface` library → connect tới `127.0.0.1:9222` (KHÔNG `localhost` — IPv6 quirk trên Windows).
- **Streaming**: poll-and-diff loop, dedup, output JSONL ra stdout.
- **Dependencies**: chỉ 2 prod deps (`@modelcontextprotocol/sdk`, `chrome-remote-interface`) + 1 dev dep (`eslint`).
- **Runtime API access** (UNDOCUMENTED, có thể break khi TV update):
  - `window.TradingViewApi._activeChartWidgetWV.value()` — chart API chính.
  - `window.TradingViewApi._chartWidgetCollection` — collection các chart widget.
  - `window.TradingViewApi._replayApi` — replay control.
  - `window.TradingViewApi._alertService` — alert management.
  - `window.TradingViewApi.searchSymbols(query)` — symbol search.
  - `window.TradingViewApi.getSavedCharts(cb)` — saved layouts.
  - `https://pine-facade.tradingview.com/pine-facade/list/?filter=saved` — Pine Script cloud list.

**Cơ chế giao tiếp**: MCP server inject JavaScript expression vào TV qua `Runtime.evaluate` (CDP), đọc kết quả trả về JSON. KHÔNG scrape TV server, KHÔNG reverse-engineer protocol, KHÔNG bypass paywall.

---

## 3. Nó làm gì (tính năng chính)

| Nhóm | Tools | Mô tả |
|------|-------|-------|
| **Chart reading** | `chart_get_state`, `data_get_study_values`, `quote_get`, `data_get_ohlcv` | Đọc symbol, timeframe, indicator values, OHLCV. `summary:true` cho output compact. |
| **Pine Script dev** | `pine_set_source`, `pine_smart_compile`, `pine_get_errors`, `pine_analyze`, `pine_get_console`, `pine_save`, `pine_new`, `pine_open`, `pine_list_scripts` | Viết, inject, compile, debug, analyze Pine Script. Loop: inject → compile → đọc errors → fix. |
| **Pine graphics** | `data_get_pine_lines`, `data_get_pine_labels`, `data_get_pine_tables`, `data_get_pine_boxes` | Đọc `line.new()`, `label.new()`, `table.new()`, `box.new()` output từ indicator (PDH, session levels, profiler tables). Dùng `study_filter` để target indicator cụ thể. |
| **Chart control** | `chart_set_symbol`, `chart_set_timeframe`, `chart_set_type`, `chart_manage_indicator`, `chart_scroll_to_date`, `chart_set_visible_range` | Đổi ticker (BTCUSD, AAPL, ES1!, NYMEX:CL1!), resolution (1, 5, 15, 60, D, W, M), style (Candles, HeikinAshi, Line, Area, Renko). |
| **Multi-pane** | `pane_list`, `pane_set_layout`, `pane_focus`, `pane_set_symbol` | Setup grid 2x2, 3x1, 6, 8. Mỗi pane có symbol riêng. |
| **Tab** | `tab_list`, `tab_new`, `tab_close`, `tab_switch` | Quản lý chart tabs. |
| **Drawing** | `draw_shape`, `draw_list`, `draw_remove_one`, `draw_clear` | Trend line, horizontal line, rectangle, text annotation. |
| **Alerts** | `alert_create`, `alert_list`, `alert_delete` | Price alert (crossing, greater_than, less_than). |
| **Replay** | `replay_start`, `replay_step`, `replay_autoplay`, `replay_trade`, `replay_status`, `replay_stop` | Practice trading trên historical bars. `replay_trade` simulate buy/sell/close. |
| **Streaming** | `tv stream quote/bars/values/lines/labels/tables/all` | Poll local chart, output JSONL. Dùng `jq` để filter. |
| **Screenshots** | `capture_screenshot` | Chụp chart (regions: `full`, `chart`, `strategy_tester`). Lưu vào `screenshots/`. |
| **UI automation** | `ui_open_panel`, `ui_click`, `ui_evaluate`, `ui_fullscreen`, `ui_hover`, `ui_scroll`, `ui_find`, `ui_type`, `ui_keyboard` | Open panel, click by aria-label/text/data-name, eval arbitrary JS, toggle fullscreen. |
| **Batch** | `batch_run` | Run action across multiple symbols/timeframes. |
| **Watchlist** | `watchlist_get`, `watchlist_add` | Read/modify watchlist. |
| **Layout** | `layout_list`, `layout_switch` | Quản lý saved layouts. |
| **Connection** | `tv_launch`, `tv_health_check`, `tv_discover` | Auto-detect & launch TV trên Mac/Win/Linux. Verify CDP. |

---

## 4. Context Management (điểm mạnh)

Tools return compact output mặc định để giữ context window:

| Tool | Output thường | Output nếu không compact |
|------|---------------|--------------------------|
| `quote_get` | ~200 bytes | (đã compact) |
| `data_get_study_values` | ~500 bytes | (đã compact, scan all indicators) |
| `data_get_pine_lines` | ~1-3 KB per study (deduplicated levels) | Có thể 80KB+ nếu không dedupe |
| `data_get_pine_labels` | ~2-5 KB per study (capped 50) | |
| `data_get_pine_tables` | ~1-4 KB per study (formatted rows) | |
| `data_get_ohlcv` (summary) | ~500 bytes | 8KB cho 100 bars, 40KB cho 500 |
| `capture_screenshot` | ~300 bytes (file path only) | Image raw rất nặng |

**Quy tắc từ CLAUDE.md:**
1. Luôn dùng `summary:true` trên `data_get_ohlcv` (trừ khi cần bar riêng lẻ).
2. Luôn dùng `study_filter` trên pine tools khi biết indicator name.
3. KHÔNG dùng `verbose:true` trừ khi user explicitly yêu cầu raw.
4. Tránh `pine_get_source` trên script phức tạp — có thể 200KB+.
5. Tránh `data_get_indicator` trên protected/encrypted — inputs là blob encoded. Dùng `data_get_study_values` thay.
6. Dùng `capture_screenshot` cho visual context thay vì pull data lớn.
7. Gọi `chart_get_state` MỘT LẦN ở đầu session, reuse entity IDs.
8. Cap OHLCV: 20 bars cho quick analysis, 100 cho deeper, 500 chỉ khi specifically cần.

**Tổng context cho "analyze my chart" workflow:** ~5-10 KB thay vì ~80 KB không compact.

---

## 5. Demo & Test

**Không có GUI demo** trong repo — đây là MCP server, "demo" = workflow trong Claude Code hoặc CLI.

**CLI examples:**
```bash
tv status                          # check CDP connection
tv quote                           # current price
tv symbol AAPL                     # change symbol
tv ohlcv --summary                 # price summary
tv screenshot -r chart             # capture chart
tv pine compile                    # compile Pine Script
tv pane layout 2x2                 # 4-chart grid
tv pane symbol 1 ES1!              # set pane symbol
tv stream quote | jq '.close'      # monitor price changes
```

**Test trong repo:** 29 tests, chạy bằng `node --test` (built-in test runner).

| Test file | Size | Cần TV live? |
|-----------|------|--------------|
| `e2e.test.js` | 65 KB | ✅ Có |
| `pine_analyze.test.js` | 10 KB | ❌ (offline) |
| `sanitization.test.js` | 13 KB | ❌ (JS injection prevention) |
| `replay.test.js` | 14 KB | ❌ |
| `cli.test.js` | 5 KB | ❌ |
| `launch.test.js` | 7 KB | ❌ |
| `chart_indicator.test.js` | 3 KB | ❌ |
| `chart_history.test.js` | 3 KB | ❌ |
| `chart_visible_range.test.js` | 2 KB | ❌ |
| `update.test.js` | 5 KB | ❌ |

`npm test` chạy e2e + pine_analyze. `npm run test:unit` bỏ e2e (chạy trong CI). `npm run test:all` chạy hết.

---

## 6. Điểm độc đáo của bản `monet88` so với parent

Theo README, `monet88/tradingview-mcp` là **independent continuation** của `tradesdontlie/tradingview-mcp`. Các thêm mới:

1. **`tv_launch` MCP tool** với Windows MSIX auto-fallback. Khi `C:\Program Files\WindowsApps\TradingView.Desktop_*\TradingView.exe` bị "Access is denied" (vì MSIX package restriction), tự động copy package ra `%LOCALAPPDATA%\tradingview-mcp\` (~330MB) rồi launch từ đó. Login, layout, chart state được giữ.

2. **`agents/performance-analyst.md`** — Claude agent persona cho chart analysis workflow.

3. **`skills/`** — 5 Claude skills đóng gói sẵn:
   - `chart-analysis/` — đọc chart tổng hợp.
   - `multi-symbol-scan/` — scan nhiều symbol.
   - `pine-develop/` — Pine Script dev workflow.
   - `replay-practice/` — replay trading practice.
   - `strategy-report/` — strategy backtest report.

4. **`RESEARCH.md`** mới với open research questions, findings, related work (FinAgent, FinGPT, Toolformer, ReAct).

5. **`SETUP_GUIDE.md`** clean, có step-by-step cho Claude Code install + Windows MSIX specific notes.

6. **84 tools** (parent có thể ít hơn).

---

## 7. Risk & Limitations

| Risk | Mức độ | Note |
|------|--------|------|
| **Undocumented API dependency** | Cao | `window.TradingViewApi._*` có thể đổi bất kỳ lúc. Pin TV version nếu cần ổn định. |
| **TV ToS violation** | Trung bình | TV cấm automated collection, scraping, non-display usage. Repo disclaimer nhấn mạnh risk. |
| **Account ban** | Có thể | Nếu TV phát hiện mass automation từ account. |
| **Brand new repo** | Thấp | 0 star, 0 fork. Nhưng inherit từ parent đã mature. |
| **Streaming + agent latency** | Trung bình | LLM reasoning chậm hơn tick rate. Dùng streaming cho human monitor, không phải agent auto. |
| **Test coverage** | Trung bình | 29 tests, E2E cần live TV. |
| **Windows MSIX exec** | Đã fix | Auto-fallback copy package. |
| **Headless server** | Không khả thi | Cần GUI session cho Electron. |

---

## 8. Use case tóm tắt

### Phù hợp ✅
- Trader cá nhân có TV Pro+ sub + dùng Claude Code, muốn AI đọc chart tự động.
- Pine Script developer muốn loop "viết → compile → đọc error → fix" với AI.
- Quant researcher nghiên cứu agent-trading paradigm.
- Team nhỏ 1-3 người muốn automation chart nội bộ.
- Developer muốn extend MCP server cho use case riêng.

### Không phù hợp ❌
- User không có TV paid sub.
- Team muốn share 1 instance (stdio MCP = per-user local).
- Production auto-trade thật (chỉ chart interaction, không execute lệnh).
- Cần real-time data 24/7 từ cloud (local-only).
- Production financial system (không SLA, dependent undocumented API).

---

**End of ANALYSIS.md**
