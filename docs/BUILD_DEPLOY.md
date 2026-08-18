# BUILD_DEPLOY.md — Triển khai `monet88/tradingview-mcp`

> Repo: https://github.com/monet88/tradingview-mcp
> Verified: 2026-08-15

---

## 1. Tóm tắt nhanh

**Build = gì?** → **KHÔNG CÓ build step.** Pure Node.js ESM, không TypeScript, không bundler.

```bash
git clone <repo> && cd <repo>
npm install
node src/server.js   # chạy MCP server (stdio)
```

Xong.

---

## 2. Prerequisites

| Yêu cầu | Version | Note |
|---------|---------|------|
| Node.js | 18+ (CI test 20.x, 22.x) | Có thể dùng 18 nhưng 20 LTS khuyến nghị |
| TradingView Desktop | Latest (recommend pin version) | Paid subscription: Pro/Premium/Expert cho real-time data |
| Claude Code | Latest | Hoặc MCP client khác (Cursor, v.v.) |
| OS | macOS, Windows, Linux | Cần GUI session cho TV Desktop |

**Không cần:**
- ❌ API key TradingView.
- ❌ GPU.
- ❌ Cloud service.
- ❌ Build tool (webpack/vite/rollup/Babel).
- ❌ TypeScript compiler.

---

## 3. Triển khai từng bước (Windows)

### Bước 1 — Clone & install

```bash
# Mở PowerShell hoặc Git Bash tại thư mục muốn clone
git clone https://github.com/monet88/tradingview-mcp.git
cd tradingview-mcp
npm install
```

**Output kỳ vọng:** Tải 2 prod deps + eslint (~5-10s).

### Bước 2 — Launch TradingView với CDP

**Cách 1 — Dùng script (recommended):**
```bash
scripts\launch_tv_debug.bat
```

Script này:
1. Kill TV instance cũ (`taskkill /F /IM TradingView.exe`).
2. Tìm `TradingView.exe` qua nhiều path:
   - `%LOCALAPPDATA%\TradingView\TradingView.exe`
   - `%PROGRAMFILES%\TradingView\TradingView.exe`
   - `%PROGRAMFILES(x86)%\TradingView\TradingView.exe`
   - MSIX: `Get-AppxPackage TradingView.Desktop` (qua `powershell -NoProfile -Command`).
   - Fallback: `dir /s /b "%PROGRAMFILES%\WindowsApps\TradingView*\TradingView.exe"`.
   - Cuối cùng: `where TradingView.exe`.
3. Start TV với `--remote-debugging-port=9222`.
4. Poll `curl http://127.0.0.1:9222/json/version` tối đa 30 lần (mỗi lần 3s) chờ CDP sẵn sàng.

**Cách 2 — Manual:**
```bash
# Path phổ biến
"%LOCALAPPDATA%\TradingView\TradingView.exe" --remote-debugging-port=9222

# Hoặc MSIX path (có thể bị "Access is denied")
"C:\Program Files\WindowsApps\TradingView.Desktop_<version>\TradingView.exe" --remote-debugging-port=9222
```

**Verify CDP ready:**
```bash
curl http://127.0.0.1:9222/json/version
# Expect: {"Browser":"...", "Protocol-Version":"1.3", ...}
```

### Bước 3 — Add vào Claude Code MCP config

Tạo/sửa `~/.claude/.mcp.json` (global) hoặc `<project>/.mcp.json` (project-scoped):

```json
{
  "mcpServers": {
    "tradingview": {
      "command": "node",
      "args": ["C:/Users/<username>/tradingview-mcp/src/server.js"]
    }
  }
}
```

**Lưu ý Windows path:** dùng forward slash `/` hoặc escaped backslash `\\` trong JSON. KHÔNG dùng single backslash.

**Optional — thêm env vars:**
```json
{
  "mcpServers": {
    "tradingview": {
      "command": "node",
      "args": ["C:/path/to/tradingview-mcp/src/server.js"],
      "env": {
        "TV_CDP_PORT": "9222",
        "TV_CDP_HOST": "127.0.0.1"
      }
    }
  }
}
```

Env vars được support:
- `TV_CDP_HOST` (hoặc `CDP_HOST`) — default `127.0.0.1`.
- `TV_CDP_PORT` (hoặc `CDP_PORT`) — default `9222`.

### Bước 4 — Restart Claude Code

```bash
# Ctrl+C để exit, rồi mở lại
claude
```

Khi load, Claude spawn `node src/server.js` như child process, kết nối stdio. 84 tools available.

### Bước 5 — Verify

Trong Claude Code:
```
Use tv_health_check to verify TradingView is connected.
```

**Response kỳ vọng:**
```json
{
  "success": true,
  "cdp_connected": true,
  "chart_symbol": "AAPL",
  "api_available": true
}
```

Nếu `cdp_connected: false` → TV chưa chạy với debug port. Quay lại Bước 2.

### Bước 6 (optional) — Install CLI global

```bash
cd tradingview-mcp
npm link
```

Giờ `tv` command available ở mọi terminal:
```bash
tv status
tv quote
tv ohlcv --summary
tv screenshot -r chart
tv stream quote | jq '.close'
```

---

## 4. Triển khai Mac

```bash
# Clone & install
git clone https://github.com/monet88/tradingview-mcp.git
cd tradingview-mcp
npm install

# Launch TV với CDP
./scripts/launch_tv_debug_mac.sh
# Hoặc manual:
/Applications/TradingView.app/Contents/MacOS/TradingView --remote-debugging-port=9222

# Add vào ~/.claude/.mcp.json (path Mac):
# {
#   "mcpServers": {
#     "tradingview": {
#       "command": "node",
#       "args": ["/Users/<username>/tradingview-mcp/src/server.js"]
#     }
#   }
# }

# Restart Claude Code, verify
```

---

## 5. Triển khai Linux

```bash
# Clone & install
git clone https://github.com/monet88/tradingview-mcp.git
cd tradingview-mcp
npm install

# Launch TV với CDP
./scripts/launch_tv_debug_linux.sh
# Hoặc manual:
tradingview --remote-debugging-port=9222
# hoặc:
/opt/TradingView/tradingview --remote-debugging-port=9222
# hoặc snap:
/snap/tradingview/current/tradingview --remote-debugging-port=9222

# Add vào ~/.claude/.mcp.json (path Linux):
# {
#   "mcpServers": {
#     "tradingview": {
#       "command": "node",
#       "args": ["/home/<username>/tradingview-mcp/src/server.js"]
#     }
#   }
# }

# Restart Claude Code, verify
```

---

## 6. Quick smoke test (không cần AI)

```bash
# 1. TV chạy với CDP (xem bước 2 ở trên)

# 2. Test CLI directly
node src/cli/index.js status
node src/cli/index.js quote
node src/cli/index.js ohlcv --summary
node src/cli/index.js screenshot -r chart

# 3. Streaming test
node src/cli/index.js stream quote | jq '.close'

# 4. Sanity check tools
node src/cli/index.js chart_get_state 2>&1
node src/cli/index.js data_get_study_values 2>&1
```

Tất cả output JSON, pipe-friendly với `jq`.

---

## 7. Troubleshooting

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| `cdp_connected: false` | TV chưa chạy với `--remote-debugging-port=9222` | Re-run `scripts\launch_tv_debug.bat` (Windows) hoặc `launch_tv_debug_mac.sh`/`launch_tv_debug_linux.sh` |
| `ECONNREFUSED 127.0.0.1:9222` | TV chưa chạy hoặc port bị block | Check Task Manager có `TradingView.exe` không; test `curl 127.0.0.1:9222/json/version` |
| Windows: "Access is denied" launching từ `WindowsApps` | MSIX package block exec từ `Program Files\WindowsApps` | Dùng `tv_launch` MCP tool (auto fallback copy `%LOCALAPPDATA%`); hoặc manual copy snippet từ SETUP_GUIDE.md |
| MCP server không hiện trong Claude Code | `~/.claude/.mcp.json` syntax sai hoặc path sai | Validate JSON, dùng absolute path, restart Claude |
| `tv` command not found globally | Chưa `npm link` | `cd tradingview-mcp && npm link` |
| Tools trả về stale data | TV còn đang load chart | Đợi vài giây rồi retry |
| `pine_*` tools fail | Pine Editor chưa mở | Gọi `ui_open_panel pine-editor open` trước |
| CI fail trên Node 18.x | Không hỗ trợ, chỉ test 20/22 | Nâng Node lên 20+ |
| `npm audit` flag high severity | Một trong 2 deps có CVE | `npm audit fix` hoặc pin version |
| `localhost` resolution fail trên Windows | `localhost` resolve IPv6 `::1`, Electron chỉ listen IPv4 | Repo đã handle: dùng `127.0.0.1`. Nếu vẫn fail, set `TV_CDP_HOST=127.0.0.1` explicitly |

### Windows MSIX manual fallback (nếu `tv_launch` không dùng được)

```powershell
# 1. Tìm MSIX install location
$pkg = (Get-AppxPackage TradingView.Desktop).InstallLocation

# 2. Copy package ra local (one-time, ~330MB)
Copy-Item "$pkg\*" "$env:LOCALAPPDATA\tradingview-mcp\TradingView" -Recurse -Force

# 3. Launch từ local copy
& "$env:LOCALAPPDATA\tradingview-mcp\TradingView\TradingView.exe" --remote-debugging-port=9222
```

**KHÔNG** dùng `icacls` trên `WindowsApps` — sẽ hỏng app servicing. Đọc files từ `WindowsApps` OK, nhưng exec thì phải copy ra.

---

## 8. CI/CD trong repo

`.github/workflows/ci.yml` chạy trên **Ubuntu + Node 20.x & 22.x**:

```yaml
- npm ci              # install deps
- npm run lint        # eslint
- npm run test:unit   # bỏ e2e (cần live TV)
- npm audit --audit-level=high
```

Local test commands:
```bash
npm test              # e2e + pine_analyze
npm run test:unit     # all unit tests (no live TV needed)
npm run test:e2e      # chỉ e2e (cần TV live)
npm run test:all      # tất cả
npm run test:verbose  # với --test-reporter=spec
```

`eslint.config.mjs` chỉ catch 5 rules:
- `no-undef` — chính, catch import rename bug.
- `no-dupe-keys`, `no-dupe-args` — object/function dup.
- `no-unreachable` — dead code.
- `no-self-assign` — `x = x`.
- `no-unused-vars` (warn) — bỏ qua vars bắt đầu bằng `_`.

---

## 9. Production-grade setup (chạy 24/7)

Mặc dù repo local-only, nếu Đại Ka muốn chạy persistent:

### Option A: Cloud VM có desktop

```bash
# 1. Cloud VM (Azure B2s / AWS t3.medium / DO $12 droplet)
#    - Windows Server 2022 (cho MSIX) HOẶC Ubuntu + Wine
#    - Min 4GB RAM, 2 vCPU

# 2. RDP vào VM, install:
#    - Node.js 20 LTS
#    - TradingView Desktop
#    - tradingview-mcp repo

# 3. Launch TV in background (Windows Task Scheduler):
#    Trigger: At startup
#    Action: TradingView.exe --remote-debugging-port=9222

# 4. Keep MCP server alive:
#    Wrap bằng PM2 (Node) hoặc NSSM (Windows service)
```

### Option B: Headless TV Web (advanced)

Dùng TV **Web** (chrome.exe --headless) thay vì Desktop:
- Cookie persist qua `user-data-dir`.
- Vẫn cần `--remote-debugging-port=9222`.
- Một số feature Desktop có thể thiếu.

### ⚠️ Risk khi chạy 24/7
- **TV ToS violation** risk: persistent bot có thể trigger detection.
- **Account ban**: từ "minor" warning tới permanent ban.
- **Cloud cost**: $5-30/tháng tùy VM.
- Đại Ka tự chịu trách nhiệm. README disclaimer rất rõ.

---

## 10. Files quan trọng trong repo

```
tradingview-mcp/
├── package.json              # 2 deps + 1 devDep, scripts
├── README.md                 # User-facing docs (đã đọc)
├── SETUP_GUIDE.md            # Step-by-step cho MCP client install
├── CLAUDE.md                 # Decision tree cho Claude (auto-loaded)
├── RESEARCH.md               # Open research questions, findings
├── eslint.config.mjs         # Minimal lint guard
├── .github/workflows/ci.yml  # CI: lint + test:unit + audit
├── src/
│   ├── server.js                  # Entry MCP — register 14 tool groups
│   ├── connection.js              # CDP client wrapper, KNOWN_PATHS
│   ├── server-chart-reader.js     # Chart reading helper
│   ├── wait.js                    # Polling helper
│   ├── core/                      # Business logic (16 modules)
│   ├── tools/                     # MCP tool registration (14 files)
│   └── cli/                       # CLI entry + commands
├── scripts/
│   ├── launch_tv_debug.bat        # Windows (MSIX-aware)
│   ├── launch_tv_debug.vbs        # Silent Windows
│   ├── launch_tv_debug_mac.sh     # Mac
│   ├── launch_tv_debug_linux.sh   # Linux
│   ├── pine_pull.js               # Pull Pine Script từ TV cloud
│   ├── pine_push.js               # Push Pine Script tới TV cloud
│   └── smoke-restore.mjs          # Smoke test + restore
├── tests/                         # 10 test files, 29 tests
├── agents/
│   └── performance-analyst.md     # Claude agent persona
└── skills/                        # 5 Claude skills
    ├── chart-analysis/
    ├── multi-symbol-scan/
    ├── pine-develop/
    ├── replay-practice/
    └── strategy-report/
```

---

**End of BUILD_DEPLOY.md**
