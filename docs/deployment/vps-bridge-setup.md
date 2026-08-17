# TDV MCP VPS Bridge Setup Guide

This guide details the complete deployment architecture for hosting the `tradingview-mcp` Streamable HTTP service on an always-on VPS while keeping TradingView Desktop locally on your PC.

## Architecture Overview

```
[ ChatGPT / Remote MCP Client ]
               │ (HTTPS + Bearer Auth)
               ▼
   [ VPS Ingress (Caddy / Nginx) ]
               │ (Reverse Proxy -> 127.0.0.1:3000)
               ▼
   [ VPS: Node.js server-http.js ]
               │ (CDP Client -> 127.0.0.1:9333)
               ▼
[ VPS Loopback Bridge: 127.0.0.1:9333 ]
               ▲
               │ (Outbound Reverse SSH Tunnel)
               │
[ PC Loopback: 127.0.0.1:9333 ]
               ▲
               │ (Chrome DevTools Protocol)
[ TradingView Desktop (manual startup) ]
```

---

## 1. VPS Setup

### Step 1.1: Clone and install dependencies
```bash
sudo mkdir -p /opt/tdv-mcp /etc/tdv-mcp
sudo chown -R ubuntu:ubuntu /opt/tdv-mcp /etc/tdv-mcp
cd /opt/tdv-mcp
git clone https://github.com/monet88/tradingview-mcp.git .
npm ci --omit=dev
```

### Step 1.2: Configure Environment
Create `/etc/tdv-mcp/tdv-mcp.env`:
```bash
sudo cp .env.example /etc/tdv-mcp/tdv-mcp.env
# Generate a strong token:
openssl rand -hex 32
# Edit /etc/tdv-mcp/tdv-mcp.env and set TDV_MCP_AUTH_TOKEN
sudo nano /etc/tdv-mcp/tdv-mcp.env
sudo chmod 600 /etc/tdv-mcp/tdv-mcp.env
```

### Step 1.3: Enable Systemd Service
```bash
sudo cp deploy/systemd/tdv-mcp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tdv-mcp
sudo systemctl status tdv-mcp
```

### Step 1.4: Configure HTTPS Ingress (Caddy or Nginx)
Using **Caddy**:
```bash
sudo cp deploy/caddy/Caddyfile /etc/caddy/Caddyfile
# Set your domain in /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

---

## 2. PC Setup (Windows)

### Step 2.1: Open TradingView with CDP (Manual)
Launch TradingView Desktop with `--remote-debugging-port=9333`:
- Use `scripts/launch_tv_debug.bat` or your desktop shortcut.
- TradingView runs locally with your charts, layouts, and indicators.

### Step 2.2: Start Bridge Supervisor
In PowerShell:
```powershell
$env:TDV_VPS_HOST = "your-vps-ip-or-domain"
$env:TDV_VPS_USER = "ubuntu"
.\scripts\bridge\bridge-supervisor.ps1
```

To install as an auto-starting background task on Windows:
```powershell
.\scripts\bridge\install-windows-task.ps1 -VpsHost "your-vps-ip-or-domain" -VpsUser "ubuntu"
```

---

## 3. Verify Deployment

### Service Health
```bash
curl https://mcp.yourdomain.com/health
# Returns: {"status":"ok","service":"tdv-mcp-http",...}
```

### MCP Tool List (with auth)
```bash
curl -X POST https://mcp.yourdomain.com/mcp \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

---

## 4. Operational Safety Guarantees

1. **Manual Lifecycle**: Remote MCP cannot start, kill, or restart TradingView on your PC (`tv_launch` is excluded).
2. **Private CDP**: CDP debug port binds only to `127.0.0.1` on both PC and VPS.
3. **Graceful Reconnection**: The VPS MCP process and the reverse bridge run independently. Opening or closing TradingView automatically updates health state on subsequent calls without restarting VPS services.
