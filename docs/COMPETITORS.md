# COMPETITORS.md — So sánh đối thủ MCP servers cho TradingView

> Researched: 2026-08-15
> Nguồn: GitHub search, web search (SkillsLLM, Glama, devlive, GitHub Topics)

---

## 1. Tổng quan thị trường

Tìm được **~20 repo MCP liên quan TradingView** trên GitHub. Chia 3 nhóm chính theo triết lý thiết kế:

- **Nhóm A: Desktop-CDP** — cần TV Desktop chạy local, dùng Chrome DevTools Protocol (giống `monet88`).
- **Nhóm B: Data API** — không cần Desktop, scrape hoặc dùng unofficial datafeed.
- **Nhóm C: Cloud / Hosted** — service thuê, không cài gì local.

Bên cạnh đó còn **đối thủ gián tiếp** là các paid financial data API (Polygon, Alpaca, Alpha Vantage, Tradier).

---

## 2. Nhóm A: Desktop-CDP (cùng triết lý với `monet88`)

### A1. `tradesdontlie/tradingview-mcp` — Parent repo

| Thuộc tính | Giá trị |
|------------|---------|
| URL | https://github.com/tradesdontlie/tradingview-mcp |
| Lineage | PARENT của monet88. MIT license. |
| Triết lý | Giống hệt monet88: CDP, stdio MCP, local-only |
| Khác biệt | Mature hơn (nhiều star hơn, contributors đông hơn). monet88 thêm `tv_launch`, `skills/`, `agents/` |
| Khi nào chọn | Nếu Đại Ka muốn version community-tested, không cần tính năng monet88-specific |

### A2. `harshil1502/tradingview-mcp` — Type-safe minimal

| Thuộc tính | Giá trị |
|------------|---------|
| URL | https://github.com/harshil1502/tradingview-mcp |
| Triết lý | Type-safe, focus chart state + OHLCV |
| Khác biệt | Ít tool hơn monet88. Đơn giản hơn. |
| Khi nào chọn | Cần minimal wrapper, không cần 84 tools |

### A3. `gagahkharismanuary/tradingview-mcp-codex` — Cho OpenAI Codex CLI

| Thuộc tính | Giá trị |
|------------|---------|
| URL | https://github.com/gagahkharismanuary/tradingview-mcp-codex |
| Triết lý | CDP + Codex CLI thay vì Claude Code |
| Khác biệt | Tương tự monet88 nhưng target OpenAI Codex thay Claude |
| Khi nào chọn | Dùng Codex CLI thay vì Claude Code |

### A4. `jadatorin/tradingview-opencode-agent` — Cho opencode.ai

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | CDP + opencode.ai |
| Khác biệt | Target opencode.ai thay Claude |
| Khi nào chọn | Nếu Đại Ka dùng opencode.ai |

### A5. `Unjoselo/tradingview-desktop-mcp` — Có MetaTrader 5

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | CDP + mirror signal sang **MetaTrader 5** |
| Khác biệt | **GẦN NHẤT với production auto-trade.** MT5 execute thật. |
| Khi nào chọn | Cần AI signal + MT5 auto-execute. **Risk cao với TV ToS.** |

### A6. `hmatrades/claude-tradingview-mcp` — Read-only

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | CDP read-only. KHÔNG có write tools, KHÔNG trade execute |
| Khác biệt | An toàn hơn, không sợ phá chart state |
| Khi nào chọn | Chỉ cần AI phân tích chart, không muốn AI touch chart |

### A7. `thinhbv/tradingview-mcp-bridge` — Vietnamese-style bridge

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | CDP bridge, fork/concept giống monet88 |
| Khác biệt | Ít star, có vẻ fork từ chain monet88/tradesdontlie |
| Khi nào chọn | Có lẽ không có lý do gì để chọn over monet08/tradesdontlie |

### A8. `CUCOCO-BOT/tradingview-mcp-bridge` — Local-data emphasis

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | CDP, "keep data local" |
| Khác biệt | Tương tự monet08, ít star |

### A9. `anhtuan2td/tradingview-mcp-bridge` — Personal AI assistant

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | "Personal AI assistant for TV Desktop charts" |
| Khác biệt | Tương tự monet08 |

### A10. `mrxjeus-cpu/tradingview-mcp` — Fork của atilaahmettaner

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | Data API + analysis (không cần Desktop) |
| Khác biệt | Có thêm hosted mode option |

---

## 3. Nhóm B: Data API (không cần TV Desktop)

### B1. `atilaahmettaner/tradingview-mcp` — Hosted, all-in-one

| Thuộc tính | Giá trị |
|------------|---------|
| URL | https://github.com/atilaahmettaner/tradingview-mcp |
| Triết lý | Scrape TV data, không cần Desktop |
| Tools | **30+ technical analysis**, backtesting, live sentiment, Yahoo Finance |
| Mode | Hosted (cloud) HOẶC self-host |
| Khác biệt | Bao quát nhất. Có backtest, sentiment, multi-exchange. |
| Risk | TV có thể block scrape → tool die. ToS violation cao hơn monet08. |
| Khi nào chọn | Không có TV Desktop, cần data + TA nhanh, chấp nhận risk |

### B2. `henrikxyz/tradingview-finance` — Data-focused

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | Quotes, historical, **SEC filings**, option chains, calendar |
| Khác biệt | Data-focused, không chart interaction |
| Khi nào chọn | Cần fundamental data (filings, options), không cần chart |

### B3. `kumarakshay2456/tradingview-mcp-india` — NSE/BSE specialist

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | Indian stock market (NSE/BSE) data |
| Tools | Top gainers, TA, backtesting |
| Khi nào chọn | Trader Ấn Độ |

### B4. `lev-corrupted/tradingview-mcp-server` — Pine v6 dev

| Thuộc tính | Giá trị |
|------------|---------|
| Tools | 25+ indicators, **Pine Script v6** dev tools, syntax validation, autocomplete, version conversion |
| Khi nào chọn | Pine developer, cần IDE-level help |

### B5. `bidouilles/mcp-tradingview-server` — FastMCP + scraper

| Thuộc tính | Giá trị |
|------------|---------|
| URL | https://github.com/bidouilles/mcp-tradingview-server |
| Triết lý | FastMCP v2 + `tradingview_scraper` lib |
| Khác biệt | Lightweight, dùng Python lib có sẵn |
| Khi nào chọn | Python-first, cần integration nhanh |

### B6. `cklose2000/pinescript-mcp-server` — Pine-only

| Thuộc tính | Giá trị |
|------------|---------|
| URL | https://github.com/cklose2000/pinescript-mcp-server |
| Triết lý | Chỉ Pine Script, có UI editor |
| Khác biệt | UI HTML test page server |
| Khi nào chọn | Pine developer cần UI workflow |

### B7. `harshil1502/tradingview-mcp-chefy` — Token-efficient backtest

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | Tối ưu context cho backtest Pine strategies |
| Khác biệt | Server-side aggregation, giảm token usage |
| Khi nào chọn | Cần backtest nặng, quan tâm context cost |

### B8. `vtlk/individual-tradingview` — Remote MCP, Binance Futures

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | **Remote MCP endpoint** (không local) |
| Tools | Strategy backtest, structured results, progress notifications |
| Constraints | Binance Futures only, max 1440 candles, rate limit 3 backtests/period |
| Khi nào chọn | Crypto Binance trader, cần remote service |

---

## 4. Nhóm C: Cloud / Hosted

### C1. `iflow-mcp/tradingview-chart-mcp` — Browser pooling

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | Cloud, fetch chart images by ticker/interval |
| Khác biệt | **Browser pooling** cho high concurrency |
| Khi nào chọn | Production scale, nhiều user concurrent |

### C2. `patch-ridermg48/tradingview-mcp-server` — Multi-exchange crypto/stock

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | Real-time screening, pattern recognition, multi-exchange |
| Khi nào chọn | Crypto + stock scanner |

### C3. `jadatorin` (hosted variant)

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | Connects TV Desktop với opencode.ai (hosted) |
| Khi nào chọn | Dùng opencode.ai |

### C4. `nightwing-7/dragonglass-tradingview-mcp` — Co-pilot

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | AI co-pilot, alerts qua REST API, automated morning briefs |
| Khác biệt | **Custom trading rules** + automated briefs |
| Khi nào chọn | Cần AI brief hàng ngày |

### C5. `CenblueOne/j-squad-tradingview-mcp` — Comprehensive

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | TV Desktop automation + screener API + Yahoo Finance + IDX/BEI tools + backtesting + news sentiment + trade math + market sessions |
| Khác biệt | ALL-IN-ONE, rất nhiều tích hợp |
| Khi nào chọn | Trader Đông Nam Á (IDX/BEI = Indonesia) |

### C6. `ertugrul59/tradingview-chart-mcp` — Minimal chart MCP

| Thuộc tính | Giá trị |
|------------|---------|
| Triết lý | Đơn giản, chỉ chart |
| Khi nào chọn | Minimal use case |

---

## 5. Đối thủ gián tiếp (không phải MCP)

| Service | Loại | Khác biệt vs MCP servers |
|---------|------|--------------------------|
| **Polygon.io** | Paid API | Legal, real-time, US-focused. $29+/tháng. |
| **Alpaca** | Brokerage API | Commission-free trading, US stocks/crypto. Có MCP integration riêng. |
| **Alpha Vantage** | Paid API | Stocks/forex/crypto, fundamental data. $50+/tháng cho real-time. |
| **Tradier** | Brokerage API | US equities/options, real-time. |
| **Interactive Brokers (IBKR)** | Brokerage API | Global markets, professional. Phức tạp nhưng đầy đủ nhất. |
| **Yahoo Finance (yfinance)** | Free unofficial | Limited, không chính thức, có thể die bất kỳ lúc. |
| **TradingView Screener API** | TV official | Có API chính thức cho screener, không phải chart. |

**Trade-off lớn:** Các paid API có SLA, support, data chuẩn. MCP server dùng TV data có UI tương tác được (chart, drawing, Pine) mà API thuần không có. Hai thế giới khác nhau.

---

## 6. So sánh trực tiếp: 3 đối thủ chính của `monet88`

| Tiêu chí | **monet08/tradingview-mcp** | **atilaahmettaner** (hosted) | **tradesdontlie** (gốc) |
|----------|------------------------------|-------------------------------|--------------------------|
| Cần TV Desktop | ✅ Có | ❌ Không | ✅ Có |
| Loại | Desktop control | Data API + analysis | Desktop control |
| Cài đặt | Manual (clone + npm) | Hosted hoặc self-host | Manual |
| Tool count | 84 | 30+ | Tương tự monet08 |
| Pine dev | ✅ Mạnh (`pine_*` tools) | ⚠️ Limited | ✅ Mạnh |
| Backtest | ❌ (chỉ replay simulate) | ✅ Có | ❌ |
| Sentiment/news | ❌ | ✅ Live sentiment | ❌ |
| Chart UI control | ✅ Đầy đủ (drawing, layout, pane) | ❌ | ✅ |
| Risk với TV ToS | Thấp (chỉ local CDP) | Cao (scrape TV data) | Thấp |
| Auto-trade | ❌ (replay only) | ❌ | ❌ |
| Ổn định | Mới, ít test (0 star) | Mature, nhiều user | Mature nhất trong nhóm |
| Custom skills/agents | ✅ Có `agents/`, `skills/` | ❌ | ❌ (hoặc ít hơn) |
| MSIX Windows support | ✅ Auto-fallback | N/A (không cần) | Có thể không |
| Phù hợp cho | Trader có TV sub + AI dev Pine | User không có TV Desktop | Trader kỹ thuật full control |

---

## 7. Decision matrix: Khi nào chọn cái nào

| User profile | Repo đề xuất | Lý do |
|--------------|--------------|-------|
| Có TV Pro+, dùng Claude Code, dev Pine Script nhiều | **monet08** | 84 tools, Pine dev workflow tốt, MSIX handled |
| Có TV Pro+, dùng Claude Code, ưu tiên community-tested | **tradesdontlie** | Parent repo, mature hơn |
| Có TV Pro+, muốn AI signal + MT5 auto-trade | **Unjoselo** | Có MT5 mirror (cẩn thận ToS) |
| Có TV Pro+, chỉ cần read-only AI analysis | **hmatrades** | An toàn, không phá chart state |
| KHÔNG có TV Desktop, cần data + TA nhanh | **atilaahmettaner** | Hosted, 30+ tools |
| Crypto Binance trader, cần remote backtest | **vtlk** | Remote MCP, Binance Futures |
| Indian stock trader | **kumarakshay2456** | NSE/BSE specialist |
| Cần fundamental data (SEC filings, options) | **henrikxyz** | Data-focused |
| Pine dev cần IDE-level help | **lev-corrupted** hoặc **cklose2000** | v6 syntax, autocomplete |
| Multi-user production | **iflow-mcp** | Browser pooling, cloud-scale |

---

## 8. Đặc điểm riêng của từng repo mà chỉ một repo có

- **Realtime sentiment/news**: atilaahmettaner.
- **Auto-trade mirror to MT5**: Unjoselo.
- **Pine Script v6 dev tools**: lev-corrupted.
- **Multi-exchange crypto screening**: patch-ridermg48.
- **Automated morning briefs**: nightwing-7.
- **Custom remote MCP endpoint**: vtlk.
- **Browser pooling cloud scale**: iflow-mcp.
- **All-in-one (TV + screener + YF + IDX + backtest + news)**: CenblueOne.
- **`agents/` + `skills/` đóng gói sẵn**: monet08.
- **MSIX Windows auto-fallback**: monet08.
- **Type-safe minimal**: harshil1502.
- **Read-only safety**: hmatrades.

`monet08` không có feature độc quyền về data, nhưng có 3 thứ hay:
1. `agents/` + `skills/` (Claude workflow đóng gói sẵn).
2. MSIX fallback (Windows user đỡ đau đầu).
3. RESEARCH.md chất lượng (research-grade doc).

---

## 9. Trend & Outlook

- **Số lượng MCP server TradingView tăng nhanh** (2024-2026). Nhiều fork từ 1-2 repo gốc (`tradesdontlie`, `atilaahmettaner`).
- **Phân hóa rõ**: Desktop-CDP (cho user có TV sub) vs Data API (cho user cần data nhanh) vs Cloud (cho production scale).
- **Vấn đề chung**: TV có thể chính thức chặn scrape bất kỳ lúc (nếu chưa). Repo disclaimer đều ghi rõ risk.
- **Tương lai có thể**: TV chính thức ra mCP server riêng? Hoặc broker API (Alpaca, IBKR) cạnh tranh trực tiếp với use case này.

---

**End of COMPETITORS.md**
